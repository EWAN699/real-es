# Asset generation log

Every Kling job, logged as it happens per `contracts/assets.md`. A job appears here the
moment it is submitted, so a failed or lost run can be traced without re-running it.

**Result URLs expire ~24 hours after generation.** The `finished` timestamp is the clock
start.

---

## V1 Step A · hero still · `hero/hero-loop-source`

| | |
| --- | --- |
| **Status** | ✅ COMPLETED — not yet downloaded (see blocker) |
| **Generation id** | `Afz-ql1IMT_KBWeaeM-GlKxw-CusTDu9KeuF5NcwvtId1zO6yftGUdrC-UtXKgVCUN_RbJoI` |
| **Tool / model** | `text_to_image` · `gemini-3-pro-image` |
| **Arguments** | `aspect_ratio=16:9`, `img_resolution=2k`, `image_count=1` |
| **Credits** | 20.0 |
| **Submitted** | 1789035305997 |
| **Finished** | 1789035338358 (~32s) |
| **Purpose** | Hero still. Also the source frame for V1 Step B (`image_to_video`). Run alone and first to discover the CDN host for the network allowlist. |

**Result URL (no watermark)** — expires ~24h from finish:

```
https://s15-kling.klingai.com/kimg/EMXN1y8qTwoGdXBsb2FkEg55bGFiLXN0dW50LXNncBo1c3RhcmdhdGUvMTEyL2UwYjI0ZGYxLTgwOGMtNDQ1Ni1hN2ZiLWYwZmFkZmQ4Nzg4Ny5wbmc.origin?x-kcdn-pid=112372
```

Watermarked variant also returned; the no-watermark URL above is the one to keep.

**Prompt:**
> A single brass door key with a plain leather fob resting on a dark walnut desk,
> photographed close and slightly from above. Shallow depth of field, the key sharp,
> the background falling away fast. Behind the desk, far out of focus, the soft
> rectangular glow of an apartment building facade at dusk - indistinct, just warm lit
> windows in a dark blue field. Warm brass and near-black palette, deep charcoal
> #12181C shadows, muted gold #B8873F highlights on the metal. Single soft key light
> from the upper left, no fill, quiet and expensive. Editorial architectural
> photography, 85mm lens, no text, no lettering, no logos, no people.

---

## CDN blocker — measured, not assumed

The host is **`s15-kling.klingai.com`**. Verified from this session:

```
curl -o /dev/null -w '%{http_code}' <result url>   →  000   (connection blocked)
getent hosts s15-kling.klingai.com                 →  resolves
```

DNS resolves; the egress proxy refuses the connection. So the allowlist entry is what
is missing, not name resolution.

**The `s15-` prefix is a shard.** Other jobs can land on different shards, so
allowlisting the single literal host risks the next six failing. The entry to add is:

```
*.klingai.com
klingai.com
```

Remaining six jobs are held until this is in place.
