// import { NextApiRequest, NextApiResponse } from 'next';

// const personMap = {
//   Bart: '314636212260308719',
//   Ian: '313176631829071688',
//   Niels: '314352839788856769',
// };

// const projectMap = {
//   Intern: '314638911914640554',
//   'Koffiedik Kijken Koffietoer': '314101649749575606',
//   'Dekoor muziektour': '314441419007722699',
//   Ringo: '325509701856920820',
// };

// export default async (_req: NextApiRequest, res: NextApiResponse) => {
//   // eslint-disable-next-line no-restricted-syntax
//   for (const item of items) {
//     const endedAt = new Date(item.Datum);
//     endedAt.setHours(endedAt.getHours() + item['Besteedde uren']);

//     const timeEntry = {
//       user_id: (personMap as any)[item.Persoon],
//       project_id: (projectMap as any)[item.Project],
//       description: item.Opmerkingen,
//       started_at: new Date(item.Datum).toISOString(),
//       ended_at: endedAt.toISOString(),
//       billable: item.Project !== 'Intern',
//     };

//     console.log(item['Besteedde uren'], timeEntry);

//     // const response = await axios.post('https://moneybird.com/api/v2/313185156605150255/time_entries.json', {
//     //   time_entry: timeEntry,
//     // }, {
//     //   headers: {
//     //     authorization: `Bearer ${process.env.MONEYBIRD_API_KEY}`,
//     //   },
//     // });
//   }

//   // console.log(response);

//   res.end('OK');
// };
