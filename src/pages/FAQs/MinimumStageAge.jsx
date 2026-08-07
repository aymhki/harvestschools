import '../../styles/MoreInfo.css'
import MinimumStageAgeTables from "../../modules/MinimumStageAgeTables.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function MinimumStageAge() {
    const { t } = useTranslation(['faqs-pages']);

  return (
    <div className={"minimum-stage-age-page"}>
        <Helmet>
            <title>Harvest International School | Minimum Stage Age</title>
            <meta name="description" content="Learn more about the minimum registration age for each stage at each American, British, and National divisions at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={"extreme-padding-container"}>
            <h1>
                {t("faqs-pages.minimum-stage-age-page.title")}
            </h1>

            <MinimumStageAgeTables/>
        </div>
    </div>
  );
}

export default MinimumStageAge;
