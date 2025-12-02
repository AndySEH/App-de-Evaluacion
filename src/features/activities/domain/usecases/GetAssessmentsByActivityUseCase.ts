import { Assessment } from "../entities/Assessment";
import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class GetAssessmentsByActivityUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(activityId: string): Promise<Assessment[]> {
    return this.repository.getAssessmentsByActivity(activityId);
  }
}
