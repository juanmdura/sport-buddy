import yfinance as yf

def get_stock_price(ticker: str) -> dict:
    """
    Retrieves the current stock price for a given ticker symbol.

    Args:
        ticker: The stock ticker symbol (e.g., 'AAPL', 'GOOGL', 'MSFT')

    Returns:
        Dictionary containing stock information including current price,
        daily high/low, and company name.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        price_data = stock.history(period="1d")

        return {
            "company_name": info.get('shortName', 'Unknown'),
            "current_price": float(price_data['Close'].iloc[-1]),
            "daily_high": float(price_data['High'].iloc[-1]),
            "daily_low": float(price_data['Low'].iloc[-1]),
            "currency": info.get('currency', 'USD'),
            "ticker": ticker
        }
    except Exception as e:
        return {
            "error": f"Failed to retrieve stock information: {str(e)}",
            "ticker": ticker
        }