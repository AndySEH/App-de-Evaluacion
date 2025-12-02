import { NewAssessment } from "../entities/Assessment";
import { AssessmentRepository } from "../repositories/AssessmentRepository";

export class AddAssessmentUseCase {
  constructor(private repository: AssessmentRepository) {}

  async execute(assessment: NewAssessment): Promise<void> {
    // Agregar fecha y hora de creación en startAt en formato YYYY-MM-DDTHH:mm
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    const assessmentWithStartDate: NewAssessment = {
      ...assessment,
      startAt: formattedDate,
    };
    
    console.log('[AddAssessmentUseCase] Assessment with startAt:', assessmentWithStartDate);
    
    return this.repository.addAssessment(assessmentWithStartDate);
  }
}
