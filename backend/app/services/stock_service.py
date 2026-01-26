
import yfinance as yf
from app.models import Stock

def fetch_stock_data(symbols: list[str]) -> list[Stock]:
    """
    Fetch stock data from Yahoo Finance for the given symbols.
    
    Args:
        symbols: List of stock symbols to fetch.
        
    Returns:
        List of Stock model instances with fetched data.
    """
    stocks_data = []
    
    for symbol in symbols:
        try:
            print(f"Fetching data for {symbol}...")
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            # Extract necessary data
            stock = Stock(
                symbol=symbol,
                company_name=info.get('longName', 'Unknown'),
                sector=info.get('sector', 'Unknown'),
                industry=info.get('industry', 'Unknown'),
                # Use current price, fallback to regular market price or previous close
                price=info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose', 0.0),
                market_cap=info.get('marketCap', 0.0),
                volume=info.get('volume', 0),
                pe_ratio=info.get('trailingPE'),
                dividend_yield=info.get('dividendYield')
            )
            stocks_data.append(stock)
            print(f"Successfully fetched data for {symbol}")
            
        except Exception as e:
            print(f"Error fetching data for {symbol}: {e}")
            
    return stocks_data
