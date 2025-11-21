import '../../styles/MoreInfo.css'
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function FAQs() {
    const { t, i18n } = useTranslation();
    const faqsTableData = t("faqs-pages.faqs-page.q-and-a-list", { returnObjects: true }) || [];

  return (
    <div className={"faqs-page"}>
        <Helmet>
            <title>Harvest International School | FAQs</title>
            <meta name="description" content="Learn more about the most frequently asked questions at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className="extreme-padding-container">
            <h1>
                {t("faqs-pages.faqs-page.title")}
            </h1>

            <p>
                {t("faqs-pages.faqs-page.intro")}
            </p>

            <p className="important-info-hyperlink-text">
                {t("faqs-pages.faqs-page.phone")} &nbsp;
                <span onClick={() => window.open('tel:+201028329668')}>
                             {t("faqs-pages.faqs-page.01028329668")}
                        </span> &nbsp;
                <span onClick={() => window.open('tel:+201097875407')}>
                            {t("faqs-pages.faqs-page.01097875407")}
                        </span> &nbsp;
                <span onClick={() => window.open('tel:+201028940675')}>
                            {t("faqs-pages.faqs-page.01028940675")}
                        </span>
            </p>

            {faqsTableData.map((member, index) => (
                <div className="faq-q-and-a-container" key={index}>

                    <div className="faq-q-and-a">
                        <div className={"faq-q-and-a-breaker"}>
                            <h1>
                                {t("faqs-pages.faqs-page.?")}
                            </h1>
                        </div>

                        <ul className={"faq-q-and-a-list"}>
                            <li className={"faq-q-and-a-list-q"} lang={i18n.language}>
                                <p lang={i18n.language}>
                                    {member.question}
                                </p>
                            </li>

                            <li className={"faq-q-and-a-list-a"} lang={i18n.language}>
                                <p lang={i18n.language}>
                                    {member.answer}
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}

export default FAQs;