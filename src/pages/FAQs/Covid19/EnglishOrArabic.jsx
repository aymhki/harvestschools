import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";

function EnglishOrArabic() {
    const left = {
        text: "English",
        link: "/covid-19/covid-19-english",
        inArabic: false,
        isAssetLink: false
    };
    const right = {
        text: "عربي",
        link: "/covid-19/covid-19-arabic",
        inArabic: true,
        isAssetLink: false
    };

    const options = [left, right];

    return (
        <FullPageOptionsSelector options={options} />
    );
}

export default EnglishOrArabic;