import { Assessment, NewAssessment } from "../../domain/entities/Assessment";
import { AssessmentRepository } from "../../domain/repositories/AssessmentRepository";
import { AssessmentDataSource } from "../datasources/AssessmentDataSource";

export class AssessmentRepositoryImpl implements AssessmentRepository {
  constructor(private dataSource: AssessmentDataSource) {}

  async getAssessmentsByActivity(activityId: string): Promise<Assessment[]> {
    return this.dataSource.getAssessmentsByActivity(activityId);
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    return this.dataSource.getAssessmentById(id);
  }

  async addAssessment(assessment: NewAssessment): Promise<void> {
    return this.dataSource.addAssessment(assessment);
  }

  async updateAssessment(id: string, updates: Partial<Assessment>): Promise<void> {
    return this.dataSource.updateAssessment(id, updates);
  }

  async deleteAssessment(id: string): Promise<void> {
    return this.dataSource.deleteAssessment(id);
  }
}
