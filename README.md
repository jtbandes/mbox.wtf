# [mbox.wtf](https://mbox.wtf/)

Analyze your `.mbox` data from Google Takeout and view a size breakdown to help reclaim your Gmail storage space.

**See how much space your emails take up!**  
Upload a .mbox file (for example, an export of your Gmail data from [Google Takeout](https://support.google.com/accounts/answer/3024190?hl=en)). You’ll see a breakdown of storage space by `From:` address.

**Privacy? 🙀**  
mbox.wtf processes your data locally and doesn’t send it anywhere. In fact, _it can’t_. A strict [Content Security Policy](https://csp-evaluator.withgoogle.com/?csp=https://mbox.wtf) prevents this webpage from making any network connections.

<details>
<summary>More about privacy</summary>

mbox.wtf is structured as a single HTML file, and the [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy) is locked down to disallow any connections whatsoever. Visit the [CSP Evaluator](https://csp-evaluator.withgoogle.com/?csp=https://mbox.wtf) to validate the website’s CSP for yourself. You can also try opening your browser’s dev tools and trying to run `fetch("")` — this should fail, demonstrating that the browser prevents the website from making any connections.

</details>

## Related projects

- https://github.com/chadaustin/gmail-mbox-analyzer
