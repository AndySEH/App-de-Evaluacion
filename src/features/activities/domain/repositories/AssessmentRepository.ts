import { Assessment, NewAssessment } from "../entities/Assessment";

export interface AssessmentRepository {
  getAssessmentsByActivity(activityId: string): Promise<Assessment[]>;
  getAssessmentById(id: string): Promise<Assessment | undefined>;
  addAssessment(assessment: NewAssessment): Promise<void>;
  updateAssessment(id: string, updates: Partial<Assessment>): Promise<void>;
  deleteAssessment(id: string): Promise<void>;
}
