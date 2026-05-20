import React, { createContext, useContext, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { COMPONENT_DEFINITIONS } from '../data/componentDefinitions';

const ProjectContext = createContext(null);

const INITIAL_SCREEN = {
  id: 'screen-1',
  name: 'Accueil',
  backgroundColor: '#FFFFFF',
  components: [],
};

const INITIAL_STATE = {
  past: [],
  future: [],
  projectName: 'Mon Projet',
  screens: [INITIAL_SCREEN],
  activeScreenId: 'screen-1',
  selectedComponentId: null,
};

function takeSnapshot(state) {
  return {
    projectName: state.projectName,
    screens: JSON.parse(JSON.stringify(state.screens)),
  };
}

function pushHistory(state, changes) {
  const snap = takeSnapshot(state);
  return {
    ...state,
    ...changes,
    past: [...state.past.slice(-19), snap],
    future: [],
  };
}

function updateScreenComponents(screens, activeScreenId, updater) {
  return screens.map(s =>
    s.id === activeScreenId ? { ...s, components: updater(s.components) } : s
  );
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.name };

    case 'ADD_SCREEN': {
      const id = `screen-${uuidv4()}`;
      const newScreen = {
        id,
        name: action.name || `Écran ${state.screens.length + 1}`,
        backgroundColor: '#FFFFFF',
        components: [],
      };
      return pushHistory(state, {
        screens: [...state.screens, newScreen],
        activeScreenId: id,
        selectedComponentId: null,
      });
    }

    case 'DELETE_SCREEN': {
      if (state.screens.length <= 1) return state;
      const remaining = state.screens.filter(s => s.id !== action.id);
      const idx = state.screens.findIndex(s => s.id === action.id);
      const newActive =
        state.activeScreenId === action.id
          ? remaining[Math.max(0, idx - 1)].id
          : state.activeScreenId;
      return pushHistory(state, {
        screens: remaining,
        activeScreenId: newActive,
        selectedComponentId: null,
      });
    }

    case 'RENAME_SCREEN':
      return pushHistory(state, {
        screens: state.screens.map(s =>
          s.id === action.id ? { ...s, name: action.name } : s
        ),
      });

    case 'DUPLICATE_SCREEN': {
      const src = state.screens.find(s => s.id === action.id);
      if (!src) return state;
      const newId = `screen-${uuidv4()}`;
      const copy = {
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: `${src.name} (copie)`,
        components: src.components.map(c => ({ ...JSON.parse(JSON.stringify(c)), id: `comp-${uuidv4()}` })),
      };
      const idx = state.screens.findIndex(s => s.id === action.id);
      const newScreens = [...state.screens];
      newScreens.splice(idx + 1, 0, copy);
      return pushHistory(state, {
        screens: newScreens,
        activeScreenId: newId,
        selectedComponentId: null,
      });
    }

    case 'SET_ACTIVE_SCREEN':
      return { ...state, activeScreenId: action.id, selectedComponentId: null };

    case 'SET_SELECTED_COMPONENT':
      return { ...state, selectedComponentId: action.id };

    case 'ADD_COMPONENT': {
      const def = COMPONENT_DEFINITIONS.find(d => d.type === action.componentType);
      if (!def) return state;
      const screen = state.screens.find(s => s.id === state.activeScreenId);
      const maxZ = screen ? Math.max(0, ...screen.components.map(c => c.zIndex || 1)) : 0;
      const size = action.overrideSize || def.defaultSize;
      const newComp = {
        id: `comp-${uuidv4()}`,
        type: def.type,
        props: { ...def.defaultProps, ...(action.overrideProps || {}) },
        position: {
          x: Math.max(0, Math.min(action.x ?? 60, 390 - size.width)),
          y: Math.max(0, Math.min(action.y ?? 100, 844 - size.height)),
          width: size.width,
          height: size.height,
        },
        zIndex: maxZ + 1,
      };
      return pushHistory(state, {
        screens: updateScreenComponents(
          state.screens,
          state.activeScreenId,
          comps => [...comps, newComp]
        ),
        selectedComponentId: newComp.id,
      });
    }

    case 'UPDATE_COMPONENT_PROPS':
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c =>
            c.id === action.id ? { ...c, props: { ...c.props, ...action.props } } : c
          )
        ),
      });

    case 'MOVE_COMPONENT':
      return {
        ...state,
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c =>
            c.id === action.id
              ? { ...c, position: { ...c.position, x: action.x, y: action.y } }
              : c
          )
        ),
      };

    case 'COMMIT_MOVE':
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c =>
            c.id === action.id
              ? { ...c, position: { ...c.position, x: action.x, y: action.y } }
              : c
          )
        ),
      });

    case 'RESIZE_COMPONENT':
      return {
        ...state,
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c =>
            c.id === action.id
              ? { ...c, position: { x: action.x, y: action.y, width: action.width, height: action.height } }
              : c
          )
        ),
      };

    case 'COMMIT_RESIZE':
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c =>
            c.id === action.id
              ? { ...c, position: { x: action.x, y: action.y, width: action.width, height: action.height } }
              : c
          )
        ),
      });

    case 'DELETE_COMPONENT':
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.filter(c => c.id !== action.id)
        ),
        selectedComponentId: null,
      });

    case 'DUPLICATE_COMPONENT': {
      const screen = state.screens.find(s => s.id === state.activeScreenId);
      if (!screen) return state;
      const comp = screen.components.find(c => c.id === action.id);
      if (!comp) return state;
      const maxZ = Math.max(0, ...screen.components.map(c => c.zIndex || 1));
      const newComp = {
        ...JSON.parse(JSON.stringify(comp)),
        id: `comp-${uuidv4()}`,
        position: {
          ...comp.position,
          x: Math.min(comp.position.x + 20, 390 - comp.position.width),
          y: Math.min(comp.position.y + 20, 844 - comp.position.height),
        },
        zIndex: maxZ + 1,
      };
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps => [
          ...comps,
          newComp,
        ]),
        selectedComponentId: newComp.id,
      });
    }

    case 'SET_Z_INDEX':
      return pushHistory(state, {
        screens: updateScreenComponents(state.screens, state.activeScreenId, comps =>
          comps.map(c => (c.id === action.id ? { ...c, zIndex: action.zIndex } : c))
        ),
      });

    case 'SET_BACKGROUND':
      return pushHistory(state, {
        screens: state.screens.map(s =>
          s.id === state.activeScreenId
            ? { ...s, backgroundColor: action.color, backgroundGradient: action.gradient !== undefined ? action.gradient : s.backgroundGradient }
            : s
        ),
      });

    case 'LOAD_PROJECT': {
      if (!action.project) return state;
      const screens = (Array.isArray(action.project.screens) && action.project.screens.length > 0)
        ? action.project.screens
        : [INITIAL_SCREEN];
      // Prefer own screens (no _remote flag) for the active screen
      const firstOwn = screens.find(s => !s._remote);
      return {
        ...INITIAL_STATE,
        projectName: action.project.projectName || 'Mon Projet',
        screens,
        activeScreenId: (firstOwn || screens[0])?.id || 'screen-1',
      };
    }

    // Used by collaboration sync — merges remote screens without touching own screens
    case 'SYNC_SCREENS': {
      const { remoteScreens = [], deletedIds = [] } = action;
      const deletedSet = new Set(deletedIds);
      const remoteById = new Map(remoteScreens.map(s => [s.id, s]));

      // Keep own screens (remove deleted), update screens modified by others
      const kept = state.screens
        .filter(s => !deletedSet.has(s.id))
        .map(s => remoteById.has(s.id) ? remoteById.get(s.id) : s);

      // Append brand-new screens from remote not yet in local state
      const keptIds = new Set(kept.map(s => s.id));
      const brandNew = remoteScreens.filter(s => !keptIds.has(s.id));

      const merged = [...kept, ...brandNew];
      const screens = merged.length > 0 ? merged : [INITIAL_SCREEN];
      const activeStillExists = screens.some(s => s.id === state.activeScreenId);
      return {
        ...state,
        screens,
        activeScreenId: activeStillExists ? state.activeScreenId : screens[0]?.id,
        selectedComponentId: null,
      };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [takeSnapshot(state), ...state.future.slice(0, 19)],
        projectName: previous.projectName,
        screens: previous.screens,
        selectedComponentId: null,
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        past: [...state.past.slice(-19), takeSnapshot(state)],
        future: state.future.slice(1),
        projectName: next.projectName,
        screens: next.screens,
        selectedComponentId: null,
      };
    }

    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}

export function useActiveScreen() {
  const { state } = useProject();
  return state.screens.find(s => s.id === state.activeScreenId) || null;
}
