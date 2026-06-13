import { playWarningAudio } from '../services/audioApi';

function getActionState({ analysisState, recommendedAction }) {
  if (analysisState === 'offline') {
    return {
      title: 'Backend Offline',
      body: 'Recommended action unavailable.',
      canBroadcast: false,
    };
  }

  if (analysisState === 'loading') {
    return {
      title: 'Awaiting Analysis',
      body: 'Analysis is running. Do not escalate without a returned recommendation.',
      canBroadcast: false,
    };
  }

  if (analysisState !== 'complete') {
    return {
      title: 'Awaiting Analysis',
      body: 'Run analysis to retrieve recommended action.',
      canBroadcast: false,
    };
  }

  if (!recommendedAction) {
    return {
      title: 'No Data Available',
      body: 'Backend did not return a recommended action.',
      canBroadcast: false,
    };
  }

  return {
    title: 'Recommended Action',
    body: recommendedAction,
    canBroadcast: true,
  };
}

export default function AlertConsole({ analysisState, recommendedAction }) {
  const action = getActionState({ analysisState, recommendedAction });

  return (
    <section className="sidebar-section recommended-action">
      <div className="section-heading">Recommended Action</div>
      <div className="recommended-action__body">
        <span className="recommended-action__title">{action.title}</span>
        <span className="recommended-action__text">{action.body}</span>
      </div>
      <button
        type="button"
        className="audio-warning-btn"
        onClick={playWarningAudio}
        disabled={!action.canBroadcast}
      >
        Broadcast Warning
      </button>
    </section>
  );
}
