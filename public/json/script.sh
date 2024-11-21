messages=(
  'Click to begin'
  'Tap to begin'
  'Tap to begin'
  'Use W,A,S,D keys to move. Use your mouse to look around. Left-click to interact and right-click to use. Left-click on the clipboard to learn more.'
  'Use the right-hand side of the screen to move, and the left-hand side to look around. Tap to interact. Tap on the clipboard to learn more.'
  'Hold and read the clipboard to get started.'
  'Read the instructions carefully and let go of the clipboard to continue!'
  'Read the instructions carefully and let go of the clipboard to continue!'
  'Read the instructions carefully and let go of the clipboard to continue!'
  'Aim towards the fire and use the right-click to dispense the foam.'
  'Aim towards the fire and use the right-click to dispense the foam.'
  'Aim towards the fire and press the trigger to dispense the foam.'
  'Right-click near any other cylinder to mix.'
  'Right-click near any other cylinder to mix.'
  'Trigger near any other cylinder to mix.'
  'You mixed the correct set of cylinders! Read the SOP or continue mixing further to continue.'
  'You mixed the correct set of cylinders! Read the SOP or continue mixing further to continue.'
  'You mixed the correct set of cylinders! Read the SOP or continue mixing further to continue.'
  'You caused a fire! Open the extinguisher cabinet, pick the extinguisher (LMB), aim at the exit door and dispense foam (RMB).'
  'You caused a fire! Open the cabinet and extinguish the fire using the action button while aiming at the exit door.'
  'Use the grip button to open the cabinet and grab the extinguisher, then aim at the exit and pull the trigger to dispense foam.'
  'You have completed the SOP!'
  'You have completed the SOP!'
  'You have completed the SOP!'
  'Left click to pick!'
  'Tap on the grab button to pick!'
  'Squeeze to pick!'
  'Mix the cylinders as mentioned in the SOP! Use your left mouse button to interact with them.'
  'Mix the cylinders as mentioned in the SOP!'
  'Mix the cylinders as mentioned in the SOP! Use your grip to interact with them.'
)

platforms=('desktop' 'mobile' 'xr')

# Loop through the array in groups of 3
for ((i = 0; i < ${#messages[@]}; i++)); do
  # Calculate the key (1-based index)
    key=$((i % 3))

    f5-tts_infer-cli \
    --model "F5-TTS" \
    --ref_audio "ref_audio.wav" \
    --ref_text "The content, subtitle or transcription of reference audio." \
    --gen_text "Some text you want TTS model generate for you."\
    --gen_file = "$key_$i.wav"

done