import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";

function EnglishOrArabic() {
    const left = {
        text: "English",
        link: "/students-life/library/english-library",
        inArabic: false,
        isAssetLink: false
    };
    const right = {
        text: "عربي",
        link: "/students-life/library/arabic-library",
        inArabic: true,
        isAssetLink: false
    };

    const options = [left, right];

  return (
    <FullPageOptionsSelector options={options} />
  );
}

export default EnglishOrArabic;