import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/MoreInfo.css';
import {Helmet} from "react-helmet-async";


function MoreInfo() {
    const options = [
        {
            title: "Frequency Asked Questions",
            image: "/assets/images/FAQsPages/FAQs1.png",
            description: "Get answers to the most common questions.",
            link: "/faqs",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Minimum Registration Age for Each Stage",
            image: "/assets/images/FAQsPages/Age2.png",
            description: "Find out the minimum age for each stage.",
            link: "/minimum-stage-age",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        },
        {
            title: "Covid-19 Policy",
            image: "/assets/images/FAQsPages/Covid1.png",
            description: "Read about the Covid-19 policy.",
            link: "/covid-19",
            buttonText: "Learn More",
            titleInArabic: false,
            descriptionInArabic: false
        }
    ];

  return (
    <div className={"more-info-page"}>
        <Helmet>
            <title>Harvest International School | FAQs</title>
            <meta name="description"
                  content="Learn more about the school's policies, age requirements, and more at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <OptionsGrid title="More Info" titleInArabic={false} options={options}/>
    </div>
  );
}

export default MoreInfo;