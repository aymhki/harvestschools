import '../../../styles/StudentsLife.css'
import Table from "../../../modules/Table.jsx";
import Form from "../../../modules/Form.jsx";

function EnglishDrama() {
  return (
    <div className={'students-life-library-books-page'}>
        <container className={"extreme-padding-container"}>
            <h1>English Drama</h1>

            <Table tableData={
                [
                    ['Title', 'Series'],
                    ['A Christmas carol +', 'Puffin classics'],
                    ["A doll's house +", 'Classic readers'],
                    ['A little princess +', 'Puffin classics'],
                    ["A midsummer night's dream +", 'Oxford school Shakespeare'],
                    ['A tale of two cities  +', 'Black cat'],
                    ['A tale of two cities +', 'Classic readers'],
                    ['A tale of two cities', 'Puffin classics'],
                    ["Aesop's fables +", 'Puffin classics'],
                    ['Aladdin +', 'Puffin classics'],
                    ['All my sons +', 'Classic readers'],
                    ['An old fashioned girl +', 'Puffin classics'],
                    ['ANNE OF AVONLEA +', 'Puffin classics'],
                    ['Anne of green gables +', 'Puffin classics'],
                    ['Anne of the island +', 'Puffin classics'],
                    ['Antony and Cleopatra +', 'Oxford school Shakespeare'],
                    ['Arms and the man +', 'Classic readers'],
                    ['Around the world in eighty days +', 'Black cat'],
                    ['Around the world in eighty days +', 'Puffin classics'],
                    ['As you like it +', 'Oxford school Shakespeare'],
                    ['Daddy – long – legs +', 'Puffin classics'],
                    ['David Copperfield +', 'Classic readers'],
                    ['David Copperfield', 'Puffin classics'],
                    ['Dracula', 'Helbling readers classics'],
                    ['Dracula +', 'Puffin classics'],
                    ['Eight cousins +', 'Puffin classics'],
                    ['Emma', 'Helbling readers classics'],
                    ['Five children and it +', 'Puffin classics'],
                    ['Great expectations +', 'Classic readers'],
                    ["Grimm's fairy tales +", 'Puffin classics'],
                    ["Gulliver's travels +", 'Black cat'],
                    ["Gulliver's travels +", 'Puffin classics'],
                    ['Hamlet +', 'Oxford school Shakespeare'],
                    ["Hans Christian Andersen's fairy tales +", 'Puffin classics'],
                    ['Hedi +', 'Puffin classics'],
                    ['Huckleberry Finn  +', 'Puffin classics'],
                    ['Jane Eyre +', 'Black cat'],
                    ['Jane Eyre +', 'Classic readers'],
                    ['Jane Eyre', 'Helbling readers classics'],
                    ['Journey to the center of the earth +', 'Black cat'],
                    ['Journey to the center of the earth +', 'Puffin classics'],
                    ['Julius Caesar +', 'Oxford school Shakespeare'],
                    ['Kidnapped +', 'Puffin classics'],
                    ['Kim +', 'Puffin classics'],
                    ['King Lear +', 'Oxford school Shakespeare'],
                    ["King Solomon's mines +", 'Puffin classics'],
                    ['Little women +', 'Classic readers'],
                    ['Little women', 'Helbling readers classics'],
                    ['Macbeth +', 'Oxford school Shakespeare'],
                    ['Madame Bovary +', 'Classic readers'],
                    ['Metamorphosis +', 'Classic readers'],
                    ['Much ado about nothing +', 'Oxford school Shakespeare'],
                    ['Murder on the orient express +', 'Classic readers'],
                    ['Oliver twist +', 'Black cat'],
                    ['Oliver twist +', 'Classic readers'],
                    ['Oliver twist', 'Helbling readers classics'],
                    ['Persuasion +', 'Classic readers'],
                    ['Peter pan +', 'Puffin classics'],
                    ['Pride and prejudice +', 'Classic readers'],
                    ['Robinson Crusoe +', 'Puffin classics'],
                    ['Robinson Crusoe', 'Helbling readers classics'],
                    ['Romeo and Juliet +', 'Oxford school Shakespeare'],
                    ['Sense and sensibility +', 'Classic readers'],
                    ['Sense and sensibility', 'Helbling readers classics'],
                    ['Silas Marner +', 'Puffin classics'],
                    ['Strange case of Dr Jekyll and Mr Hyde +', 'Puffin classics'],
                    ['The adventures of Sherlock Holmes +', 'Classic readers'],
                    ['The call of the wild +', 'Puffin classics'],
                    ['The canterville ghost and other stories +', 'Puffin classics'],
                    ['The happy prince and other tales +', 'Puffin classics'],
                    ['The jungle book +', 'Puffin classics'],
                    ['The jungle book', 'Helbling readers classics'],
                    ['The Merry adventures of Robin Hood +', 'Puffin classics'],
                    ['The merchant of Venice +', 'Oxford school Shakespeare'],
                    ['The picture of Dorian Gray +', 'Classic readers'],
                    ['The secret garden +', 'Puffin classics'],
                    ['The tempest +', 'Oxford school Shakespeare'],
                    ['The three musketeers +', 'Black cat'],
                    ['The three musketeers +', 'Puffin classics'],
                    ['The wind in the willows +', 'Puffin classics'],
                    ['Treasure island +', 'Classic readers'],
                    ['Treasure island', 'Helbling readers classics'],
                    ['Twenty thousand leagues under the sea +', 'Puffin classics'],
                    ['Wuthering heights +', 'Classic readers'],
                    ['Wuthering heights', 'Helbling readers classics']
                ]

            } numCols={2} />

            <h2>
                Recommend a book for the Library to add it to its collection
            </h2>

            <Form sendPdf={false} mailTo={'ayman.ibrahim@harvestschools.com'} formTitle={'Student Book Recommendation'} fields={
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

export default EnglishDrama;