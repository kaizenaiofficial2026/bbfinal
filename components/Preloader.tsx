export default function Preloader() {
  return (
    <div className="preloader" id="preloader" aria-hidden="true">
      <div className="preloader-inner">
        <div className="preloader-word" aria-label="Beyond Borders">
          <span className="ch">B</span>
          <span className="ch">e</span>
          <span className="ch">y</span>
          <span className="ch">o</span>
          <span className="ch">n</span>
          <span className="ch">d</span>
          <span className="ch">&nbsp;</span>
          <span className="ch">B</span>
          <span className="ch">o</span>
          <span className="ch">r</span>
          <span className="ch">d</span>
          <span className="ch">e</span>
          <span className="ch">r</span>
          <span className="ch">s</span>
        </div>
        <div className="preloader-rule">
          <span id="preloaderRule" />
        </div>
        <div className="preloader-meta">
          <span>Sri Lanka travel design</span>
          <span>
            <span id="preloaderNum">0</span>%
          </span>
        </div>
      </div>
    </div>
  );
}
