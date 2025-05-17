import '../../styles/MoreInfo.css'
import {Helmet} from "react-helmet-async";

function FAQs() {
  return (
    <div className={"faqs-page"}>
        <Helmet>
            <title>Harvest International School | FAQs</title>
            <meta name="description"
                  content="Learn more about the most frequently asked questions at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className="extreme-padding-container">
            <h1>FAQs</h1>

            <p>
                In this page you will find the most frequently asked questions. However, If you have more questions,
                please do not hesitate to reach out at:
            </p>

            <p className="important-info-hyperlink-text">
                Phone: &nbsp;
                <span onClick={() => window.open('tel:+201028329668')}>
                             01028329668,
                        </span> &nbsp;
                <span onClick={() => window.open('tel:+201097875407')}>
                            01097875407,
                        </span> &nbsp;
                <span onClick={() => window.open('tel:+201028940675')}>
                           01028940675
                        </span>
            </p>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Are there any foreign teachers at your school?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                Mostly Egyptians, Highly Qualified
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل يوجد لديكم أي مدرسين أجانب؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                تنتمي أغلبيتنا الى مصرو، نؤمن بتفوقنا
                            </p>
                        </li>
                    </ul>
                </div>


            </div>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Does the school accept any transfer from other schools?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                Yes, we accept students from other schools as long as they pass an entry test held at the school
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل تقبل المدرسة تحويلات الطلاب من المدارس الأخرى؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                نعم، بشرط اجتياز الطالب امتحان القبول بالمدرسة
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Is the school mixed?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                Yes
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل المدرسة مشتركة؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                نعم
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Does the school provide a transportation service?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                Yes, our buses cover every district in Alexandria
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل تتوافر خدمة مواصلات بالمدرسة؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                نعم تغطي سيارتنا  كل المناطق بالأسكندرية
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Does the school provide any sport activities?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                Yes, Harvest Academy provides all kinds of sports available through out the year
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل هناك أي أنشطة رياضية بالمدرسة؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                نعم توفر اكادمية المدرسة كل أنواع الرياضات طوال العام
                            </p>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="faq-breaker">
                <h1>?</h1>
            </div>

            <div className="faq-q-and-a-container">
                <div className="faq-q-and-a-english">
                    <ul className={"faq-q-and-a-list-english"}>
                        <li className={"faq-q-and-a-list-english-q"} lang={"en"}>
                            <p lang={"en"}>
                                Does the school fees change every year?
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-english-a"} lang={"en"}>
                            <p lang={"en"}>
                                No, we only apply Ministry of Education fees which can go up to 10%.
                            </p>
                        </li>
                    </ul>
                </div>

                <div className="faq-q-and-a-arabic">
                    <ul className={"faq-q-and-a-list-arabic"}>
                        <li className={"faq-q-and-a-list-arabic-q"} lang={"ar"}>
                            <p lang={"ar"}>
                                هل تتغير المصاريف الخاصة بالتعليم في مدرستكم كل عام؟
                            </p>
                        </li>

                        <li className={"faq-q-and-a-list-arabic-a"} lang={"ar"}>
                            <p lang={"ar"}>
                                لا نحن فقط نطبق الزيادة السنوية الموضوعة من قبل وزارة التربية و التعليم و التي يمكن أن تصل إلى ١٠٪
                            </p>
                        </li>
                    </ul>
                </div>
            </div>


        </div>
    </div>
  );
}

export default FAQs;