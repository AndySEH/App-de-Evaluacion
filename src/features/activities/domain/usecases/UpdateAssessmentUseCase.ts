import { Assessment } from "../entities/Assessment";
import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class UpdateAssessmentUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(id: string, updates: Partial<Assessment>): Promise<void> {
    return this.repository.updateAssessment(id, updates);
  }
}
