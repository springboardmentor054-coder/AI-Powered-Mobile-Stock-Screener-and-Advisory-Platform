## 📈 Sample Stock Dataset

The following table represents sample stock data stored in the database.  
This data is used by the AI-powered stock screener to apply filters and return results.

| Company | Sector | PE | ROE (%) | PEG | Debt/FCF | Revenue Growth | Buyback |
|-------|--------|----|--------|-----|----------|---------------|---------|
| AlphaTech | IT | 9 | 20 | 1.4 | 0.22 | Yes | Yes |
| CodeWorks | IT | 16 | 18 | 2.6 | 0.35 | Yes | No |
| SiliconPro | Semiconductor | 11 | 17 | 2.1 | 0.19 | Yes | Yes |
| TeleNet | Telecom | 14 | 12 | 3.2 | 0.45 | No | No |

---

## 🔍 Natural Language Query Examples & Results

### Query 1  
**“Show IT stocks with PE below 10”**

| Result |
|-------|
| AlphaTech |

---

### Query 2  
**“Show IT stocks with PEG less than 3 and revenue growth”**

| Result |
|-------|
| AlphaTech |
| CodeWorks |

---

### Query 3  
**“Show stocks with low debt and buybacks”**

| Result |
|-------|
| AlphaTech |
| SiliconPro |

---

### Query 4  
**“Show stocks with ROE above 15% and PE below 12”**

| Result |
|-------|
| AlphaTech |
| SiliconPro |






