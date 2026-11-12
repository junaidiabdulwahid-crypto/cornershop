#!/usr/bin/env bash
# Runs every CornerShop route against a running API, including the "last slot" race test.
# Usage: ./demo.sh   (API on http://localhost:3100, database freshly created)
set -euo pipefail

API="${API:-http://localhost:3100/api/v1}"
J='Content-Type: application/json'

step() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }
call() { curl -s -w '  → %{http_code}\n' "$@"; }
field() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s)$1))"; }

# Fresh phone numbers on every run
SUFFIX=$(( RANDOM % 9000 + 1000 ))
OWNER_PHONE="+9198765${SUFFIX}0"
C1_PHONE="+9198765${SUFFIX}1"
C2_PHONE="+9198765${SUFFIX}2"

login() { curl -s -X POST "$API/auth/login" -H "$J" -d "{\"phone\":\"$1\",\"code\":\"000000\"}" | field .access_token; }

step "1. Sign in: an owner and two customers (demo code 000000)"
OWNER=$(login "$OWNER_PHONE"); C1=$(login "$C1_PHONE"); C2=$(login "$C2_PHONE")
echo "tokens received"

step "2. Bad login: wrong phone format and wrong code"
call -X POST "$API/auth/login" -H "$J" -d '{"phone":"12345","code":"12"}'
call -X POST "$API/auth/login" -H "$J" -d "{\"phone\":\"$C1_PHONE\",\"code\":\"123456\"}"

step "3. Create a shop without signing in"
call -X POST "$API/shops" -H "$J" -d '{"name":"Bokaro Chai Corner","category":"Cafe","latitude":23.6694,"longitude":86.1512}'

step "4. Owner creates two shops"
SHOP=$(curl -s -X POST "$API/shops" -H "$J" -H "Authorization: Bearer $OWNER" \
  -d '{"name":"Bokaro Chai Corner","category":"Cafe","latitude":23.6694,"longitude":86.1512}' | field .id)
curl -s -o /dev/null -X POST "$API/shops" -H "$J" -H "Authorization: Bearer $OWNER" \
  -d '{"name":"Momo Point","category":"Cafe","latitude":23.6765,"longitude":86.1512}'
echo "shop id: $SHOP"

step "5. Shops within 2 km, nearest first"
call "$API/shops/nearby?lat=23.6695&lng=86.1513"
call "$API/shops/nearby?lat=abc&lng=86.15"

step "6. Owner adds an offer (limit 3 per day); a customer tries too"
OFFER=$(curl -s -X POST "$API/shops/$SHOP/offers" -H "$J" -H "Authorization: Bearer $OWNER" \
  -d '{"title":"10% off on any bill","discount_percent":10,"daily_limit":3}' | field .id)
echo "offer id: $OFFER"
call -X POST "$API/shops/$SHOP/offers" -H "$J" -H "Authorization: Bearer $C1" -d '{"title":"Free chai","discount_percent":100}'

step "7. Redeem from 2 km away, then at the counter: 10% of ₹480.75"
call -X POST "$API/offers/$OFFER/redeem" -H "$J" -H "Authorization: Bearer $C1" -d '{"bill_amount":480.75,"latitude":23.6875,"longitude":86.1512}'
call -X POST "$API/offers/$OFFER/redeem" -H "$J" -H "Authorization: Bearer $C1" -d '{"bill_amount":480.75,"latitude":23.6695,"longitude":86.1513}'

step "8. Sneak an extra field into the body"
call -X POST "$API/offers/$OFFER/redeem" -H "$J" -H "Authorization: Bearer $C1" -d '{"bill_amount":100,"latitude":23.6695,"longitude":86.1513,"tip":50}'

step "9. Race: 5 customers redeem at the same moment, 2 slots left"
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w '%{http_code} ' -X POST "$API/offers/$OFFER/redeem" -H "$J" -H "Authorization: Bearer $C2" \
    -d '{"bill_amount":100,"latitude":23.6695,"longitude":86.1513}' &
done
wait; echo "(expect two 201s and three 400s)"
call "$API/shops/$SHOP/offers"

step "10. Reviews: owner refused, customer once, then a duplicate"
call -X POST "$API/shops/$SHOP/reviews" -H "$J" -H "Authorization: Bearer $OWNER" -d '{"rating":5,"comment":"Best shop ever"}'
call -X POST "$API/shops/$SHOP/reviews" -H "$J" -H "Authorization: Bearer $C1" -d '{"rating":5,"comment":"Great chai, quick service"}'
call -X POST "$API/shops/$SHOP/reviews" -H "$J" -H "Authorization: Bearer $C1" -d '{"rating":1,"comment":"Changed my mind"}'
call -X POST "$API/shops/$SHOP/reviews" -H "$J" -H "Authorization: Bearer $C2" -d '{"rating":4,"comment":"Good momos nearby too"}'
call "$API/shops/$SHOP/reviews"

step "11. Unknown routes and bad IDs keep the same error shape"
call "$API/offers/not-a-uuid/redeem" -X POST -H "$J" -H "Authorization: Bearer $C1" -d '{}'
call "$API/nope?lat=23.6"

step "12. Health"
call "$API/health"
