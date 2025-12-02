import { NewPeerEvaluation } from "../entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

// Función para generar UUID simple
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class AddPeerEvaluationUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(peerEvaluation: NewPeerEvaluation): Promise<void> {
    console.log('[AddPeerEvaluationUseCase] Executing with data:', peerEvaluation);
    console.log('[AddPeerEvaluationUseCase] evaluateeId received:', peerEvaluation.evaluateeId);
    console.log('[AddPeerEvaluationUseCase] evaluatorId received:', peerEvaluation.evaluatorId);
    
    // Generar UUID para el campo id
    const peerEvaluationWithId = {
      ...peerEvaluation,
      id: generateUUID()
    };

    
    console.log('[AddPeerEvaluationUseCase] Generated UUID:', peerEvaluationWithId.id);
    console.log('[AddPeerEvaluationUseCase] evaluateeId in final object:', peerEvaluationWithId.evaluateeId);
    console.log('[AddPeerEvaluationUseCase] evaluatorId in final object:', peerEvaluationWithId.evaluatorId);
    console.log('[AddPeerEvaluationUseCase] Complete data with id:', peerEvaluationWithId);
    
    try {
      const result = await this.repository.addPeerEvaluation(peerEvaluationWithId);
      console.log('[AddPeerEvaluationUseCase] Success');
      return result;
    } catch (error) {
      console.error('[AddPeerEvaluationUseCase] Error:', error);
      throw error;
    }
  }
}
