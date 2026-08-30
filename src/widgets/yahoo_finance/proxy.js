import createLogger from "utils/logger";
import { httpProxy } from "utils/proxy/http";

const logger = createLogger("yahooFinanceProxy");

// range -> chart interval; also serves as the allowlist of valid ranges
const INTERVALS = {
  "1h": "1m",
  "1d": "2m",
  "5d": "15m",
  "1mo": "30m",
  "3mo": "1d",
  "6mo": "1d",
  "1y": "1d",
  "2y": "1wk",
  "5y": "1wk",
  "10y": "1mo",
  ytd: "1d",
  max: "3mo",
};

export default async function yahooFinanceProxyHandler(req, res) {
  const { endpoint } = req.query;

  if (endpoint === "quote" && req.query.query) {
    try {
      const { symbol, range: requestedRange } = JSON.parse(req.query.query);
      const range = requestedRange in INTERVALS ? requestedRange : "1d";

      if (symbol) {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${
          INTERVALS[range]
        }&range=${range}`;
        const [status, contentType, data] = await httpProxy(url, {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        });

        if (contentType) res.setHeader("Content-Type", contentType);
        return res.status(status).send(data);
      }
    } catch (e) {
      logger.error("Error parsing query or fetching data: %s", e);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(400).json({ error: "Invalid request" });
}
