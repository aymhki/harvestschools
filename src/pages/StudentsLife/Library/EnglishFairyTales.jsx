import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet";

function EnglishFairyTales() {
  return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | English Library | Fairy Tails</title>
              <meta name="description"
                    content="Learn more about the avialable books in the Fairy Tails category at the English library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <container className={"extreme-padding-container"}>
              <h1>English Fairy Tails</h1>

              <Table tableData={
                  [
                      ['Title', 'Series'],
                      ['Alice in wonderland', 'Young explorers'],
                      ['Charlie and the chocolate factory', '50 years'],
                      ['Dante', 'Young explorers'],
                      ['Down the rabbit hole', 'Young explorers'],
                      ['Goldilocks and the three bears', 'Young explorers'],
                      ['In the jungle', 'Young explorers'],
                      ['James and the giant peach', '50 years'],
                      ['Monsters, inc', 'Disnep'],
                      ['Peter pan', 'Disnep'],
                      ['Return to never land', 'Disnep'],
                      ["Roald Dahl's revolting rhymes", '50 years'],
                      ['Sleeping beauty', 'Disnep'],
                      ['Snow white and the seven dwarfs', 'Disnep'],
                      ['The BFG', '-'],
                      ['The Bick racer', 'Young explorers'],
                      ['The camcorder thief', 'Young explorers'],
                      ['The enormous crocodile', '50 years'],
                      ['The incredible', 'Disnep'],
                      ['The little mermaid', 'Disnep'],
                      ['The magic flute', 'Young explorers'],
                      ['The twits', '50 years'],
                      ['The wonderful story of Henry sugar and six more', '50 years']
                  ]

              } numCols={2}
                     sortConfigParam={{column: 1, direction: 'ascending'}}/>

              <h2>
                  Recommend a book for the Library to add it to its collection
              </h2>

              <Form sendPdf={false} mailTo={'ayman.ibrahim@harvestschools.com'}
                    formTitle={'Student Book Recommendation'} fields={
                  [
                      {
                          id: 1,
                          type: 'text',
                          label: 'Name',
                          name: 'name',
                          required: true,
                          labelOutside: false,
                          httpName: 'Name',
                          placeholder: 'Enter your name',
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
                          placeholder: 'Enter your email',
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
                          placeholder: 'Enter the book title',
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
                          placeholder: 'Enter the author or writer',
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
                          placeholder: 'Enter the series name or distributor',
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
                          placeholder: 'Why do you think this book should be added to the library?',
                          widthOfField: 1
                      },
                  ]
              }/>


          </container>
      </div>
  );
}

export default EnglishFairyTales;