import { Fragment } from "react";
import FoldText from "@/components/ui/FoldText";

/**
 * A line that folds in, cut into words that do not break. FoldText sets every
 * letter as a box of its own, and a line of such boxes wraps wherever it runs
 * out of room - in the middle of a word. The words are silent: the heading
 * that uses this says its sentence once itself, in an sr-only span.
 */
export default function FoldWords({ text }: { text: string }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span className="inline-block whitespace-nowrap">
        <FoldText text={word} silent />
      </span>
    </Fragment>
  ));
}
