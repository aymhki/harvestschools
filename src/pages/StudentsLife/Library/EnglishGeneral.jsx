import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";
import {Helmet} from "react-helmet";

function EnglishGeneral() {
  return (
      <div className={'students-life-library-books-page'}>
          <Helmet>
              <title>Harvest International School | English Library | General</title>
              <meta name="description"
                    content="Learn more about the avialable books in the General category at the English library at Harvest International School in Borg El Arab, Egypt."/>
              <meta name="keywords"
                    content="Harvest International School, HIS, Borg El-Arab, Borg Al-Arab, Egypt, مدارس هارفست, برج العرب, مدرسة, هارفست, Students Union, Students Life, Activies, Facilties, Student Clubs, اتحاد الطلاب, حياة الطلاب, أنشطة, مرافق, نوادي الطلاب"/>
              <meta name="author" content="Harvest International School"/>
              <meta name="robots" content="index, follow"/>
              <meta name="googlebot" content="index, follow"/>
          </Helmet>
          <container className={"extreme-padding-container"}>
              <h1>English General</h1>

              <Table tableData={
                  [
                      ['1001 ways to reward employees'],
                      ['1984 +'],
                      ['50 great short stories +'],
                      ['7 habits (the courage to change)'],
                      ['A country doctor +'],
                      ['A house like a lotus +'],
                      ['A midsummer night scream +'],
                      ['A wind in the door +'],
                      ['A wrinkle in time +'],
                      ['Adel\'s island'],
                      ['Alice\'s adventures in wonderland'],
                      ['Alice\'s adventures in wonderland and through the looking glass +'],
                      ['Ancient Egyptian magic +'],
                      ['Animal farm +'],
                      ['Anna Karenina +'],
                      ['Antigoddess +'],
                      ['Around the world in 80 days'],
                      ['Benny\'s pennies'],
                      ['Beowulf +'],
                      ['Beowulf +'],
                      ['Blood of the lamb +'],
                      ['Books that changed the world +'],
                      ['Boy'],
                      ['Boy and going solo'],
                      ['Boy tales of childhood'],
                      ['Cars'],
                      ['Cat among The pigeons +'],
                      ['Champion'],
                      ['Charlie and chocolate factory'],
                      ['Charlie and Mr. willy wonka'],
                      ['Charlie and the chocolate factory'],
                      ['Charlie and the chocolate factory'],
                      ['Charlie and the chocolate factory'],
                      ['Charlie and the great glass elevator'],
                      ['Chasing redbird'],
                      ['Chicken little'],
                      ['David Copperfield +'],
                      ['David Copperfield +'],
                      ['Dirty beasts'],
                      ['Dogs don\'t wear sneakers'],
                      ['Dr. jekyll and mr. Hyde'],
                      ['Dragon\'s in the waters +'],
                      ['Early African American classics +'],
                      ['Eclipse +'],
                      ['Eldest +'],
                      ['Escape from the carnival +'],
                      ['Esio trot'],
                      ['Fantastic Mr. fox'],
                      ['Fantastic mr.fox'],
                      ['Far from the madding crowd +'],
                      ['Forest mage +'],
                      ['Four great plays +'],
                      ['Frankenstein +'],
                      ['Going solo'],
                      ['Grail quest – Morgan\'s revenge +'],
                      ['Grail quest – the shadow companion +'],
                      ['Grasslands'],
                      ['GREAT EXPECTATIONS +'],
                      ['GREAT EXPECTATIONS +'],
                      ['Great expectations +'],
                      ['Greek drama +'],
                      ['Gulliver\'s travels +'],
                      ['Gulliver\'s travels'],
                      ['Hancock park +'],
                      ['Heart of light +'],
                      ['Hoot +'],
                      ['Howards end +'],
                      ['Ibsen volume 2 +'],
                      ['Idiot\'s geometry'],
                      ['Idiot\'s statistics'],
                      ['Jacob\'s room +'],
                      ['James and the giant peach'],
                      ['James and the giant peach'],
                      ['James and the giant peach'],
                      ['Jane Eyre +'],
                      ['Kidnapped +'],
                      ['King john and Henry vile +'],
                      ['Lights'],
                      ['Lord Jim +'],
                      ['Maggie a girl of the streets +'],
                      ['Matilda +'],
                      ['Me and my dad'],
                      ['Misery guts +'],
                      ['More about boy'],
                      ['Mrs. mcnosh'],
                      ['My uncle Oswald +'],
                      ['Nick Butterworth: making books'],
                      ['O pioneers +'],
                      ['Red wall +'],
                      ['Revolting recipes'],
                      ['Revolting rhymes'],
                      ['Sea of glory +'],
                      ['Seeing redd +'],
                      ['Serumdiddlyumptious: sticker book'],
                      ['Shadow fell +'],
                      ['Shadow\'s edge +'],
                      ['Silas marner +'],
                      ['Silent night +'],
                      ['Sister carrie +'],
                      ['Skin & other stories +'],
                      ['Song in silence +'],
                      ['Sphinx\'s princess +'],
                      ['Steinbeck\'s ghost +'],
                      ['storm chaser +'],
                      ['Story – sketcher'],
                      ['Summer +'],
                      ['Tales from Shakespeare (2 activities books) +'],
                      ['Tales of the unexpected +'],
                      ['Ten plays +'],
                      ['Tess of the d\'Urbervilles +'],
                      ['The 100 greatest leadership +'],
                      ['The 7 habits (teens)'],
                      ['The 8th habit'],
                      ['The adventure of tom sawyer +'],
                      ['The Arabian knights +'],
                      ['The best of Roald Dahl +'],
                      ['The Canterbury tales +'],
                      ['The carnivorous carnival +'],
                      ['The castle in the attic +'],
                      ['The complete plays of Aristophanes +'],
                      ['The complete plays of Sophocles +'],
                      ['The death of ivan ilyich +'],
                      ['The dialogues of Plato +'],
                      ['The enormous crocodile'],
                      ['The fifth mountain +'],
                      ['The heron and the humming bird'],
                      ['The house of the seven +'],
                      ['The island of dr. moreau +'],
                      ['The jungle book +'],
                      ['The king\'s deception +'],
                      ['The king\'s new suit'],
                      ['The looking glass wars +'],
                      ['the lord of the ring the two towers +'],
                      ['The magic +'],
                      ['The magic finger'],
                      ['The magic finger'],
                      ['The major plays +'],
                      ['The map to everywhere +'],
                      ['The mayor of casterbridge +'],
                      ['The merchant of Venice +'],
                      ['The minpins'],
                      ['The missing golden ticket'],
                      ['The mistmantele +'],
                      ['The phantom of the opera +'],
                      ['The prince and the pauper +'],
                      ['The red pony +'],
                      ['The return of the native +'],
                      ['The scarlet letter +'],
                      ['The sea wolf +'],
                      ['The secret agent +'],
                      ['The secret garden +'],
                      ['The secret hero +'],
                      ['The secret power +'],
                      ['The slippery slope +'],
                      ['The sneezes'],
                      ['The story of king Arthur and his knights +'],
                      ['The Swiss family +'],
                      ['The tempest +'],
                      ['The tempest +'],
                      ['The turn of the screw and other short fiction +'],
                      ['The twists: a set of plays'],
                      ['The umbrella man +'],
                      ['The very ordered existence of Merilee marvelous +'],
                      ['The vicar of nibbles wicker'],
                      ['The wind in the willows +'],
                      ['The witches: a set of plays'],
                      ['The wonderful story of Henry sugar'],
                      ['The wrong trousers'],
                      ['Three early comedies (Shakespeare) +'],
                      ['To build afire and other stories +'],
                      ['Treasure island +'],
                      ['Troll mill +'],
                      ['Uncle tom\'s cabin'],
                      ['War and Peace +'],
                      ['Washington'],
                      ['Westland'],
                      ['Wizard and glass +']
                  ]

              } numCols={1}
                     sortConfigParam={{column: 0, direction: 'ascending'}}/>


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

export default EnglishGeneral;