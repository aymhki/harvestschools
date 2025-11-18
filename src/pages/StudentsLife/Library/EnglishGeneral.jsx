import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet-async";
import {useTranslation} from "react-i18next";

function EnglishGeneral() {
    const {t} = useTranslation();

    const booksTable = t('students-life-pages.library-pages.english-general-page.books', { returnObjects: true }) || [];
    const tableRows = Array.isArray(booksTable) ? booksTable.map(member => [member.title]) : [];
    const finalTableData = [...tableRows];

    return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | English Library | General</title>
              <meta name="description" content="Learn more about the avialable books in the General category at the English library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords" content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <div className={"extreme-padding-container"}>
              <h1>
                  {t("students-life-pages.library-pages.english-general-page.title")}
              </h1>

              <Table tableData={finalTableData} numCols={1} sortConfigParam={{column: 0, direction: 'ascending'}}/>


              <h2>
                  {t("students-life-pages.library-pages.suggest-book-form.recommend-a-book-for-the-library-to-add-to-its-collection")}
              </h2>

              <Form sendPdf={false} mailTo={'ayman.ibrahim@harvestschools.com'}
                    formTitle={t("students-life-pages.library-pages.suggest-book-form.student-book-recommendation-form")} fields={
                  [
                      {
                          id: 1,
                          type: 'text',
                          label: 'Name',
                          name: 'name',
                          required: true,
                          labelOutside: false,
                          httpName: 'Name',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.enter-your-name"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.enter-your-name"),
                          widthOfField: 2
                      },
                      {
                          id: 2,
                          type: 'email',
                          label: 'Email',
                          name: 'email',
                          required: true,
                          labelOutside: false,
                          httpName: 'Email',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.enter-your-email"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.enter-your-email"),
                          widthOfField: 2
                      },
                      {
                          id: 3,
                          type: 'text',
                          label: 'Book Title',
                          name: 'book_title',
                          required: true,
                          labelOutside: false,
                          httpName: 'Book Title',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.enter-book-title"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.enter-book-title"),
                          widthOfField: 3
                      },
                      {
                          id: 4,
                          type: 'text',
                          label: 'Author or Writer',
                          name: 'author',
                          required: true,
                          labelOutside: false,
                          httpName: 'Author',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.enter-book-author"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.enter-book-author"),
                          widthOfField: 3
                      },
                      {
                          id: 5,
                          type: 'text',
                          label: 'Series or Distributor',
                          name: 'series',
                          required: false,
                          labelOutside: false,
                          httpName: 'Series',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.enter-the-series-name-or-distributor"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.enter-the-series-name-or-distributor"),
                          widthOfField: 3

                      },
                      {
                          id: 6,
                          type: 'textarea',
                          label: 'Why do you think this book should be added to the library?',
                          name: 'reason',
                          required: true,
                          labelOutside: false,
                          httpName: 'Reason',
                          displayLabel: t("students-life-pages.library-pages.suggest-book-form.why-do-you-think-this-book-should-be-added-to-the-library"),
                          placeholder: t("students-life-pages.library-pages.suggest-book-form.why-do-you-think-this-book-should-be-added-to-the-library"),
                          widthOfField: 1
                      },
                  ]
              }  captchaLength={1} lang={'en'}/>

          </div>
      </div>
  );
}

export default EnglishGeneral;