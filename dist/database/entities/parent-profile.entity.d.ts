import { User } from './user.entity';
import { ParentStudentRelation } from './parent-student-relation.entity';
export declare class ParentProfile {
    id: string;
    userId: string;
    customFields: Record<string, string>;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    parentStudentRelations: ParentStudentRelation[];
}
