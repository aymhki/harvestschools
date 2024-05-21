import OptionsGrid from "../../modules/OptionsGrid.jsx";
import '../../styles/FAQs.css';


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
        <OptionsGrid title="More Info" titleInArabic={false} options={options}/>
    </div>
  );
}

export default MoreInfo;