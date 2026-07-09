/**
 * Actor Factory
 * Creates simulation actors (virtual users)
 */

import {
  SimulationActor,
  VirtualUserProfile,
  RelationshipState,
  MemoryState,
  WorldState,
  MoodState,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ActorFactory {

  createActor(profile: VirtualUserProfile): SimulationActor {
    return {
      id: uuidv4(),
      profile,
      currentState: {
        mood: MoodState.NEUTRAL,
        energy: 0.7,
        stress: 0.3,
        health: 0.8,
        motivation: 0.6,
      },
      relationshipState: this.createDefaultRelationshipState(),
      memoryState: this.createDefaultMemoryState(),
      worldState: this.createDefaultWorldState(),
      conversationHistory: [],
    };
  }

  createActors(profiles: VirtualUserProfile[]): SimulationActor[] {
    return profiles.map(profile => this.createActor(profile));
  }

  private createDefaultRelationshipState(): RelationshipState {
    return {
      affinity: 50,
      trust: 50,
      intimacy: 30,
      passion: 40,
      interactionCount: 0,
      lastInteraction: new Date(),
    };
  }

  private createDefaultMemoryState(): MemoryState {
    return {
      factMemories: [],
      emotionalMemories: [],
      sharedMemories: [],
      totalMemoriesCount: 0,
    };
  }

  private createDefaultWorldState(): WorldState {
    return {
      currentScene: 'home',
      atmosphere: 'comfortable',
      weather: 'mild',
      timeOfDay: 'afternoon',
      season: 'spring',
      contextualEvents: [],
    };
  }

  cloneActor(actor: SimulationActor): SimulationActor {
    return {
      id: uuidv4(),
      profile: { ...actor.profile },
      currentState: { ...actor.currentState },
      relationshipState: { ...actor.relationshipState },
      memoryState: {
        factMemories: [...(actor.memoryState.factMemories || [])],
        emotionalMemories: [...(actor.memoryState.emotionalMemories || [])],
        sharedMemories: [...(actor.memoryState.sharedMemories || [])],
        totalMemoriesCount: actor.memoryState.totalMemoriesCount,
      },
      worldState: { ...actor.worldState },
      conversationHistory: [...actor.conversationHistory],
    };
  }
}
