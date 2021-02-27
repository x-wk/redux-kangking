export default interface AppState {
   count?: number;
   tasks?: Array<Task>
}

export interface Task {
   id: string;
   title: string;
   isCompleted: boolean;
   createdTime?: Date;
   updatedTime?: Date;
}
