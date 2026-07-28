import { Request, Response } from 'express';

export async function mediaProxy(req: Request, res: Response) {
  try {
    const directUrl = req.query.url as string;
    if (!directUrl) {
      return res.status(400).json({ error: 'Missing url parameter' });
    }

    const reqHeaders: Record<string, string> = {};
    if (req.headers.range) {
      reqHeaders['Range'] = req.headers.range as string;
    }

    const upstreamRes = await fetch(directUrl, { headers: reqHeaders });
    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).send(`Media stream error: HTTP ${upstreamRes.status}`);
    }

    res.status(upstreamRes.status);
    upstreamRes.headers.forEach((val: string, key: string) => {
      if (['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].includes(key.toLowerCase())) {
        res.setHeader(key, val);
      }
    });

    const arrayBuf = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(arrayBuf));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
