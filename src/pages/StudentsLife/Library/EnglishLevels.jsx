import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet";

function EnglishLevels() {
  return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | English Library | Levels</title>
              <meta name="description"
                    content="Learn more about the avialable books in the Levels category at the English library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>

          <container className={"extreme-padding-container"}>
              <h1>English Levels</h1>

              <Table tableData={
                  [
                      ['Title', 'Series'],
                      ['A Christmas carol', 'Helbling readers'],
                      ["Alice's adventures in wonder land", 'Helbling readers'],
                      ['Anne of green gables Anne arrives', 'Helbling readers'],
                      ['Beauty and beast', 'Helbling young readers'],
                      ['Black beauty', 'Helbling readers'],
                      ['David and the great detective', 'Helbling readers'],
                      ['David Copperfield', 'Green apple'],
                      ['Freddy the frog prince', 'Helbling young readers'],
                      ["Gulliver's travels", 'Helbling readers'],
                      ['Little women', 'Helbling readers'],
                      ['Lola in the land of fire', 'Helbling young readers'],
                      ['Oliver twist', 'Helbling readers'],
                      ['Oliver twist', 'Green apple'],
                      ['Peter pan', 'Helbling readers'],
                      ['Robin hood', 'Helbling readers'],
                      ['Robinson Crusoe', 'Green apple'],
                      ['Sam and the sunflower seeds', 'Helbling young readers'],
                      ['The big fire', 'Helbling young readers'],
                      ['The big wave', 'Helbling young readers'],
                      ['The fisher man and his wife', 'Helbling young readers'],
                      ['The happy prince and the nightingale and the rose', 'Helbling readers'],
                      ['The hare and the tortoise', 'Helbling young readers'],
                      ['The kite', 'Helbling young readers'],
                      ['The leopard and the monkey', 'Helbling young readers'],
                      ['The prince and the pauper', 'Helbling readers'],
                      ['The secret garden', 'Helbling readers'],
                      ['The stolen white elephant', 'Helbling readers'],
                      ['Treasure island', 'Helbling readers'],
                      ['Treasure island', 'Green apple']
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
              }  captchaLength={1}/>

          </container>
      </div>
  );
}

export default EnglishLevels;