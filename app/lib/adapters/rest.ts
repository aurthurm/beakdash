// import { DataAdapter } from '@/app/types/adapter';
// import { RESTDataSource } from '@/app/types/datasource';
// import axios from 'axios';


// export class RESTAdapter implements DataAdapter {
//   constructor(private config: RESTDataSource) {}

//   async initialize(): Promise<void> {
//     // No initialization needed for REST
//   }

//   async fetchData(): Promise<any[]> {
//     const response = await axios({
//       method: this.config.method,
//       url: this.config.endpoint,
//       headers: this.config.headers,
//       data: this.config.body
//     });

//     if (this.config.dataPath) {
//       return this.extractData(response.data, this.config.dataPath);
//     }

//     return response.data;
//   }

//   private extractData(obj: any, path: string): any[] {
//     return path.split('.').reduce((acc, part) => acc?.[part], obj) || [];
//   }

//   async cleanup(): Promise<void> {
//     // No cleanup needed for REST
//   }
// }


// // // REST API Widget
// // const apiWidget = {
// //   id: '2',
// //   title: 'User Activity',
// //   chartType: 'bar',
// //   dataSource: {
// //     type: 'rest',
// //     endpoint: 'https://api.example.com/stats',
// //     method: 'GET',
// //     headers: {
// //       'Authorization': 'Bearer ${token}'
// //     },
// //     dataPath: 'data.statistics'
// //   }
// // };