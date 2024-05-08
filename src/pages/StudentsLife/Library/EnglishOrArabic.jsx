import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";

function EnglishOrArabic() {
    const left = {
        text: "English",
        link: "/library/english",
        inArabic: false
    };
    const right = {
        text: "عربي",
        link: "/library/arabic",
        inArabic: true
    };

  return (
    <FullPageOptionsSelector left={left} right={right} />
  );
}

export default EnglishOrArabic;