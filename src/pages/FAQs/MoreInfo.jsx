import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/MoreInfo.css';
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";


function MoreInfo() {
    const {t} = useTranslation();

    const options = [
        {
            title: t("faqs-pages.options-page.faqs-option"),
            image: "/assets/images/FAQsPages/FAQs1.png",
            description: t("faqs-pages.options-page.faqs-option-description"),
            link: "/faqs",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("faqs-pages.options-page.minimum-registration-age-option"),
            image: "/assets/images/FAQsPages/Age2.png",
            description:  t("faqs-pages.options-page.minimum-registration-age-option-description"),
            link: "/minimum-stage-age",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: t("faqs-pages.options-page.covid-19-policy-option"),
            image: "/assets/images/FAQsPages/Covid1.png",
            description: t("faqs-pages.options-page.covid-19-policy-option-description"),
            link: "/covid-19",
            buttonText: t("common.learn-more"),
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className={"more-info-page"}>
        <Helmet>
            <title>Harvest International School | FAQs</title>
            <meta name="description" content="Learn more about the school's policies, age requirements, and more at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title={t("faqs-pages.options-page.title")} titleInArabic={false} options={options}/>
    </div>
  );
}

export default MoreInfo;