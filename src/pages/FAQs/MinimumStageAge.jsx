import '../../styles/MoreInfo.css'
import Table from "../../modules/Table.jsx";
import {Helmet} from "react-helmet-async";

function MinimumStageAge() {
  return (
    <div className={"minimum-stage-age-page"}>
        <Helmet>
            <title>Harvest International School | Minimum Stage Age</title>
            <meta name="description"
                  content="Learn more about the minimum registration age for each stage at each American, British, and National divisions at Harvest International School in Borg El Arab, Egypt."/>
            <meta name="keywords"
                  content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Frequently Asked Questions, Questions, FAQ, Answers, Policies, Age Requirements, Covid-19, سؤال وجواب, أسئلة, إجابات, سياسات, متطلبات العمر, كوفيد-19"/>
            <meta name="author" content="Harvest International School"/>
            <meta name="robots" content="index, follow"/>
            <meta name="googlebot" content="index, follow"/>
        </Helmet>

        <div className={"extreme-padding-container"}>
            <h1>Minimum Stage Age</h1>
            <p>
                Please Note,
            </p>
            <p>
                Students should meet the minimum registration age on the 1st of October.
            </p>

            <Table tableHeader={"National Division"} numCols={2} tableData={[
                ["Stage", "Minimum Registration Age"],
                ["KG1", "4 Years"],
                ["KG2", "5 Years"],
                ["J1", "6 Years"],
                ["J2", "7 Years"],
                ["J3", "8 Years"],
                ["J4", "9 Years"],
                ["J5", "10 Years"],
                ["J6", "11 Years"],
                ["M1", "12 Years"],
                ["M2", "13 Years"],
                ["M3", "14 Years"],
                ["S1", "15 Years"],
                ["S2", "16 Years"],
                ["S3", "17 Years"],

                ]}/>

            <Table tableHeader={"International Division"} numCols={2} tableData={[
                ["Stage", "Minimum Registration Age"],
                ["FS 1, Pre - K", "3 Years & 6 Months"],
                ["FS 2, K", "4 Years & 6 Months"],
                ["Y 1, G 1", "5 Years & 6 Months"],
                ["Y 2, G 2", "6 Years & 6 Months"],
                ["Y 3, G 3", "7 Years & 6 Months"],
                ["Y 4, G 4", "8 Years & 6 Months"],
                ["Y 5, G 5", "9 Years & 6 Months"],
                ["Y 6, G 6", "10 Years & 6 Months"],
                ["Y 7, G 7", "11 Years & 6 Months"],
                ["Y 8, G 8", "12 Years & 6 Months"],
                ["Y 9, G 9", "13 Years & 6 Months"],
                ["Y 10, G 10", "14 Years & 6 Months"],
                ["Y 11, G 11", "15 Years & 6 Months"],
                ["Y 12, G 12", "16 Years & 6 Months"],
                ]}/>

            <p>
                Note: This page was last updated on January 02, 2023
            </p>
        </div>
    </div>
  );
}

export default MinimumStageAge;