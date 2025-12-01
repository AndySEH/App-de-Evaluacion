import { NewAssessment } from "../entities/Assessment";
import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class AddAssessmentUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(assessment: NewAssessment): Promise<void> {
    return this.repository.addAssessment(assessment);
  }
}
