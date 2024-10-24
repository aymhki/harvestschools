import FullPageOptionsSelector from "../../../modules/FullPageOptionsSelector.jsx";
import {Helmet} from "react-helmet";

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
        <>
            <Helmet>
                <title>Harvest International School | Covid-19</title>
                <meta name="description"
                      content="Learn more about Harvest schools Covid-19 policy in Borg El Arab, Egypt."/>
                <meta name="keywords"
                      content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
                <meta name="author" content="Harvest International School"/>
                <meta name="robots" content="index, follow"/>
                <meta name="googlebot" content="index, follow"/>
            </Helmet>

            <FullPageOptionsSelector options={options} />
        </>
    );
}

export default EnglishOrArabic;