import React, { useEffect, useState } from 'react';
import { getExerciseDemo } from '../data/exerciseDemos';
import { Exercise } from '../data/sportLingoData';

type ExerciseDemoProps = {
  exercise: Exercise;
  nextExercise?: Exercise;
  phase: 'exercise' | 'rest';
  isRunning: boolean;
  tv: (value: string) => string;
};

const ExerciseDemo: React.FC<ExerciseDemoProps> = ({
  exercise,
  nextExercise,
  phase,
  isRunning,
  tv,
}) => {
  const [mediaFailed, setMediaFailed] = useState(false);
  const sequenceDemo = getExerciseDemo(exercise.name);
  const lowerBodyDemo = ['Chair Squat', 'Glute Bridge', 'Reverse Lunge', 'Wall Sit', 'Calf Raise'].includes(exercise.name);
  const hasBuiltInDemo = exercise.name === 'Jumping Jacks'
    || exercise.name === 'Arm Circles'
    || exercise.name === 'Standing Hip Openers'
    || lowerBodyDemo
    || Boolean(sequenceDemo);

  useEffect(() => {
    setMediaFailed(false);
  }, [exercise.name, exercise.mediaUrl]);

  const renderJumpingJacksDemo = () => (
    <div className={`jumping-jacks-demo h-72 rounded-md ${isRunning && phase === 'exercise' ? '' : 'jj-paused'}`}>
      <div className="jj-badge">FitLingo demo</div>
      <div className="jj-figure" aria-label="Animated Jumping Jacks demo">
        <div className="jj-shadow" />
        <div className="jj-head" />
        <div className="jj-body" />
        <div className="jj-arm jj-arm-left" />
        <div className="jj-arm jj-arm-right" />
        <div className="jj-leg jj-leg-left" />
        <div className="jj-leg jj-leg-right" />
      </div>
      <div className="jj-floor" />
    </div>
  );

  const renderArmCirclesDemo = () => (
    <div className={`arm-circles-demo h-72 rounded-md ${isRunning && phase === 'exercise' ? '' : 'ac-paused'}`}>
      <div className="ac-badge">FitLingo demo</div>
      <div className="ac-halo ac-halo-left" />
      <div className="ac-halo ac-halo-right" />
      <div className="ac-figure" aria-label="Animated Arm Circles demo">
        <div className="ac-head" />
        <div className="ac-body" />
        <div className="ac-arm ac-arm-left">
          <span />
        </div>
        <div className="ac-arm ac-arm-right">
          <span />
        </div>
        <div className="ac-leg ac-leg-left" />
        <div className="ac-leg ac-leg-right" />
      </div>
      <div className="ac-floor" />
    </div>
  );

  const renderHipOpenersDemo = () => (
    <div className={`hip-openers-demo h-72 rounded-md ${isRunning && phase === 'exercise' ? '' : 'ho-paused'}`}>
      <div className="ho-badge">FitLingo demo</div>
      <div className="ho-sequence" aria-label="Standing Hip Openers sequence demo">
        {[
          ['ho-pose-1', 'ho-mini-lift-front', 'Lift'],
          ['ho-pose-2', 'ho-mini-open-side', 'Open'],
          ['ho-pose-3', 'ho-mini-return', 'Return'],
        ].map(([poseClass, legClass, label]) => (
          <div key={label} className={`ho-pose ${poseClass}`}>
            <div className="ho-mini-body" />
            <div className="ho-mini-head" />
            <div className="ho-mini-arm ho-mini-arm-left" />
            <div className="ho-mini-arm ho-mini-arm-right" />
            <div className="ho-mini-leg ho-mini-stand" />
            <div className={`ho-mini-leg ${legClass}`} />
            <div className="ho-mini-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRestDemo = () => (
    <div className="rest-demo h-72 rounded-md">
      <div className="rest-pulse" />
      <div className="rest-card">
        <p className="text-sm font-black uppercase tracking-wide text-cyan-700">10 second reset</p>
        <h3 className="mt-2 text-3xl font-black text-slate-950">Breathe</h3>
        <p className="mt-2 text-sm font-bold text-slate-600">
          {nextExercise ? `Next up: ${tv(nextExercise.name)}` : 'Workout complete next'}
        </p>
      </div>
    </div>
  );

  const renderSequenceDemo = () => {
    if (!sequenceDemo) return null;

    return (
      <div className={`sequence-demo h-72 rounded-md ${isRunning && phase === 'exercise' ? '' : 'sd-paused'}`}>
        <div className="sd-badge">FitLingo demo</div>
        <div className="sd-focus">{tv(sequenceDemo.focus)}</div>
        <div className="sd-track" aria-label={`${exercise.name} sequence demo`}>
          {sequenceDemo.labels.map((label, index) => (
            <div key={label} className={`sd-step sd-step-${index + 1}`}>
              <div className="sd-figure">
                <div className="sd-head" />
                <div className="sd-body" />
                <div className="sd-limb sd-arm sd-arm-left" />
                <div className="sd-limb sd-arm sd-arm-right" />
                <div className="sd-limb sd-leg sd-leg-left" />
                <div className="sd-limb sd-leg sd-leg-right" />
              </div>
              <p className="sd-label">{tv(label)}</p>
              <p className="sd-cue">{tv(sequenceDemo.cues[index])}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLowerBodyDemo = () => {
    const demoClass = exercise.name
      .toLowerCase()
      .replace(/[^a-z]+/g, '-')
      .replace(/^-|-$/g, '');

    const cueMap: Record<string, [string, string]> = {
      'Chair Squat': ['Sit hips back', 'Stand tall'],
      'Glute Bridge': ['Lift hips', 'Squeeze glutes'],
      'Reverse Lunge': ['Step back', 'Push forward'],
      'Wall Sit': ['Slide down', 'Hold steady'],
      'Calf Raise': ['Rise up', 'Lower slow'],
    };
    const cues = cueMap[exercise.name] || ['Move', 'Control'];

    return (
      <div className={`lower-body-demo lower-${demoClass} h-72 rounded-md ${isRunning && phase === 'exercise' ? '' : 'lb-paused'}`}>
        <div className="lb-badge">FitLingo demo</div>
        <div className="lb-cue lb-cue-left">{tv(cues[0])}</div>
        <div className="lb-cue lb-cue-right">{tv(cues[1])}</div>
        <div className="lb-scene" aria-label={`${exercise.name} animated demo`}>
          <div className="lb-wall" />
          <div className="lb-mat" />
          <div className="lb-figure">
            <div className="lb-shadow" />
            <div className="lb-head" />
            <div className="lb-body" />
            <div className="lb-arm lb-arm-left" />
            <div className="lb-arm lb-arm-right" />
            <div className="lb-thigh lb-thigh-left" />
            <div className="lb-thigh lb-thigh-right" />
            <div className="lb-shin lb-shin-left" />
            <div className="lb-shin lb-shin-right" />
            <div className="lb-foot lb-foot-left" />
            <div className="lb-foot lb-foot-right" />
          </div>
        </div>
      </div>
    );
  };

  const renderMedia = () => {
    if (phase === 'rest') return renderRestDemo();
    if (exercise.name === 'Jumping Jacks') return renderJumpingJacksDemo();
    if (exercise.name === 'Arm Circles') return renderArmCirclesDemo();
    if (exercise.name === 'Standing Hip Openers') return renderHipOpenersDemo();
    if (lowerBodyDemo) return renderLowerBodyDemo();

    const sequenceMedia = renderSequenceDemo();
    if (sequenceMedia) return sequenceMedia;

    if (exercise.mediaUrl && exercise.mediaType === 'video' && isRunning && phase === 'exercise') {
      return (
        <video
          className="h-72 w-full rounded-md object-cover"
          src={exercise.mediaUrl}
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }

    if (!mediaFailed && exercise.mediaUrl && isRunning && phase === 'exercise' && (exercise.mediaType === 'gif' || exercise.mediaType === 'image')) {
      return (
        <img
          className="h-72 w-full rounded-md object-cover"
          src={exercise.mediaUrl}
          alt={exercise.name}
          onError={() => setMediaFailed(true)}
        />
      );
    }

    return (
      <div className="grid h-72 place-items-center rounded-md bg-slate-950 p-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-sm font-black uppercase tracking-wide text-orange-200">
            {exercise.mediaUrl ? 'Press Start to play demo' : 'GIF coming soon'}
          </p>
          <p className="mt-3 text-3xl font-black">{tv(exercise.name)}</p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            {tv(exercise.instructorCue || 'We will add a matching demo for this movement.')}
          </p>
        </div>
      </div>
    );
  };

  const credit = phase === 'rest'
    ? 'Rest screen built into FitLingo.'
    : hasBuiltInDemo
      ? 'Animated demo built into FitLingo.'
      : exercise.mediaCredit || 'Demo GIF provided by external exercise media source.';

  return (
    <>
      {renderMedia()}
      {(phase === 'rest' || hasBuiltInDemo || (exercise.mediaUrl && !mediaFailed)) && (
        <p className="mt-2 text-xs font-bold text-slate-500">{credit}</p>
      )}
    </>
  );
};

export default ExerciseDemo;
