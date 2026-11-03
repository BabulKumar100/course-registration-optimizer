/* Small marker that shows an HTML tooltip through the global TooltipLayer.
   Safe to place inside a label: clicking it does not activate the field. */
export default function Hint({ tip }) {
  const plain = String(tip).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return (
    <span
      className="hint"
      data-tip={tip}
      tabIndex={0}
      aria-label={plain}
      onClick={(e) => e.preventDefault()}
    >
      ?
    </span>
  );
}
