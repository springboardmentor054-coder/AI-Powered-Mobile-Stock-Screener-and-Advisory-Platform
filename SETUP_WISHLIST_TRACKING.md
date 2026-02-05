# Quick Setup for Wishlist Daily Tracking

## Run these commands in order:

# 1. Create the wishlist_history table
node backend/scripts/createWishlistHistoryTable.js

# 2. Wait for updateAllStocks to finish, then run snapshot capture
node backend/scripts/captureWishlistSnapshots.js

# Now your wishlist will track daily changes!

## To test the API endpoints:

# Get wishlist with yesterday's comparison
curl http://localhost:3000/api/wishlist -H "Authorization: Bearer YOUR_TOKEN"

# Get 30-day history for a specific stock
curl http://localhost:3000/api/wishlist/history/AAPL?days=30 -H "Authorization: Bearer YOUR_TOKEN"
