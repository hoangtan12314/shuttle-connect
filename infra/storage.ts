// Session cover photos. The server validates an upload (host, size, content type) before ever
// writing it, so every object under covers/ is already a checked, publishable cover -- there's
// no private/unconfirmed prefix to stage, expire, or wall off from the CDN.
export const mediaBucket = new sst.aws.Bucket("shuttle-connect-media", {
  // Lets CloudFront (via Origin Access Control) read objects; the bucket stays private otherwise.
  access: "cloudfront",
  // No browser request ever reaches this bucket directly -- uploads go through the API, which
  // writes here server-side -- so there's nothing for bucket CORS to answer.
  cors: false,
});

// CloudFront in front of the bucket. Its default price class covers every edge location,
// including Southeast Asia, so Vietnam traffic is served nearby.
export const mediaCdn = new sst.aws.Router("shuttle-connect-media-cdn", {
  transform: {
    cdn: (args) => {
      args.defaultCacheBehavior = $output(args.defaultCacheBehavior).apply((behavior) => ({
        ...behavior,
        // AWS's Managed-SecurityHeadersPolicy: adds X-Content-Type-Options: nosniff (plus HSTS,
        // X-Frame-Options, Referrer-Policy). nosniff stops a browser from treating a file that
        // claims to be an image as HTML/script.
        responseHeadersPolicyId: "67f7725c-6f97-4210-82d7-5512b31e9d03",
      }));
    },
  },
});
mediaCdn.routeBucket("/covers", mediaBucket);
