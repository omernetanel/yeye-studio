import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_NAME } from "@/lib/site";

/**
 * The card a link to this site turns into — in WhatsApp, on X, in a Slack
 * message. Until now there was none, so every share of the studio's own site
 * arrived as a bare grey box.
 *
 * Drawn here rather than exported as a file so it cannot drift from the site:
 * the same wordmark, the same black on white. A PNG in /public would be a
 * second copy of the brand to keep in step by hand.
 *
 * NO TEXT ON IT, AND THAT IS NOT A STYLE CHOICE. The image generator parses
 * font files itself and rejects the variable fonts this site is built from
 * ("Cannot read properties of undefined"), and the only face it ships with has
 * no Hebrew — a Hebrew line would come out as a row of boxes. The wordmark is
 * artwork, so it needs no font at all. The title and description beside the
 * card come from the page's own metadata and carry the words.
 */
export const alt = `${SITE_NAME} - סטודיו דיגיטלי`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(path.join(process.cwd(), "public/images/logo.png"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* The wordmark is white artwork on transparent, so it is inverted to
            black the same way the site inverts it.
            next/image has nothing to do here: this tree is rendered by the
            image generator, not by a browser, and it understands plain img. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={620}
          height={265}
          style={{ filter: "brightness(0)" }}
          alt=""
        />
      </div>
    ),
    size,
  );
}
