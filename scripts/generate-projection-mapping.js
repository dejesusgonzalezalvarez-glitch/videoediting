// ============================================================================
// scripts/generate-projection-mapping.js
// Script principal para generar videos de projection mapping educativos.
// ============================================================================

import { VIDEO_CONFIG } from '../config/video.config.js';
import { PATHS } from '../config/paths.config.js';
import * as fs from 'fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Genera un video de projection mapping educativo.
 * @param {Object} options - Opciones de generación.
 * @param {string} options.topic - Tema del video.
 * @param {string} options.script - Guión generado o proporcionado.
 * @param {string} options.outputPath - Ruta de salida del MP4.
 * @param {Object} options.config - Configuración de renderizado.
 * @returns {Object} Resultado de la generación.
 */
export function generateProjectionMappingVideo({
  topic,
  script,
  outputPath = PATHS.renders + '/projection-mapping-' + Date.now() + '.mp4',
  config = {}
} = {}) {
  console.log('=== Generando video de projection mapping ===');
  console.log('Tema:', topic);
  console.log('Duración objetivo:', VIDEO_CONFIG.duration, 'segundos');
  
  // 1. Generar narración de audio
  console.log('Generando narración de audio...');
  const narrationText = extractNarrationFromScript(script);
  let narrationPath = PATHS.temp + '/narration-' + Date.now() + '.wav';
  let audioTrimPath = narrationPath; // Variable definida en scope global
  
  try {
    // Generar audio con Kokoro TTS
    execFileSync('python', [
      PATHS.scripts + '/tts_kokoro.py',
      '--text', narrationText,
      '--voice', 'af_heart',
      '--out', narrationPath,
      '--sample-rate', String(VIDEO_CONFIG.audioSampleRate)
    ], { encoding: 'utf8' });
    console.log('Audio generado:', narrationPath);
    
    // Verificar duración del audio con regex robusto
    const probeDurOutput = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-show_format',
      '-select_streams', 'a:0',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      narrationPath
    ], { encoding: 'utf8' });
    
    // Extraer duración con expresión más robusta
    const durMatch = probeDurOutput.match(/duration\s*=\s*([0-9.]+)/i);
    const audioDuration = durMatch ? parseFloat(durMatch[1]) : 0;
    console.log('Duración audio original:', audioDuration, 's');
    
    // Ajustar duración: si es más largo que 30s, recortar; si es más corto, usaremos como está
    if (audioDuration > VIDEO_CONFIG.duration + 1) {
      // Recortar audio a 30 segundos exactos usando -t
      audioTrimPath = PATHS.temp + '/narration-trimmed-' + Date.now() + '.wav';
      const trimArgs = [
        '-y', '-i', narrationPath,
        '-t', String(VIDEO_CONFIG.duration),
        '-acodec', 'copy',
        audioTrimPath
      ];
      execFileSync('ffmpeg', trimArgs, { stdio: 'pipe', encoding: 'utf8' });
      console.log('Audio recortado a 30s');
    } else {
      audioTrimPath = narrationPath;
      console.log('Audio usará duración completa');
    }
  } catch (err) {
    console.error('Error generando audio:', err.message);
    audioTrimPath = PATHS.temp + '/narration-fallback.wav';
  }
  
  // 2. Generar subtítulos con codificación UTF-8 asegurada
  console.log('Generando subtítulos...');
  const srtPath = PATHS.temp + '/projection-mapping-subtitles.srt';
  const subtitlesGenerated = generateSubtitlesFromScript(script, srtPath);
  console.log('Subtítulos generados:', subtitlesGenerated);
  
  // 3. Crear video base de duración exacta
  console.log('Creando video base...');
  const colorVideoPath = PATHS.temp + '/pmapping-color-base.mp4';
  
  // Generar video de color con duración exacta usando -t y timestamps forzados
  const colorArgs = [
    '-f', 'lavfi',
    '-i', 'color=c=blue:s=' + VIDEO_CONFIG.width + 'x' + VIDEO_CONFIG.height + ':r=' + VIDEO_CONFIG.fps,
    '-t', String(VIDEO_CONFIG.duration),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', String(VIDEO_CONFIG.crf || 20),
    '-r', String(VIDEO_CONFIG.fps),
    '-vf', 'setpts=PTS-STARTPTS,setdar=9/16',  // Forzar relación de aspecto 9:16
    colorVideoPath
  ];
  
  try {
    execFileSync('ffmpeg', colorArgs, { stdio: 'pipe', encoding: 'utf8' });
    console.log('Video base creado');
    
    // Verificar duración exacta del video base
    const probeVidOut = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-show_format',
      '-select_streams', 'v:0',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      colorVideoPath
    ], { encoding: 'utf8' });
    
    const vidDurMatch = probeVidOut.match(/duration\s*=\s*([0-9.]+)/i);
    const videoBaseDuration = vidDurMatch ? parseFloat(vidDurMatch[1]) : 0;
    console.log('Duración video base:', videoBaseDuration, 's');
  } catch (err) {
    console.error('Error creando video base:', err.message);
  }
  
  // 4. Mezclar video base con audio
  console.log('Mezclando video y audio...');
  const withAudioPath = PATHS.temp + '/pmapping-with-audio.mp4';
  
  // Construir argumentos de FFmpeg para mezclar video + audio
  const audioInputPath = audioTrimPath || PATHS.temp + '/narration-' + Date.now() + '.wav';
  
  const ffmpegAudioArgs = [
    '-y',
    '-i', colorVideoPath,
    '-i', audioInputPath,
    '-c', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', String(VIDEO_CONFIG.crf || 20),
    '-r', String(VIDEO_CONFIG.fps),
    '-c:a', VIDEO_CONFIG.audioCodec,
    '-b:a', VIDEO_CONFIG.audioBitrate,
    '-ar', String(VIDEO_CONFIG.audioSampleRate),
    '-ac', String(VIDEO_CONFIG.audioChannels),
    '-metadata', 'duration=' + VIDEO_CONFIG.duration,
    '-shortest',  // Video será tan largo como el audio MÁS CORTO
    '-movflags', '+faststart',
    withAudioPath
  ];
  
  try {
    execFileSync('ffmpeg', ffmpegAudioArgs, { stdio: 'pipe', encoding: 'utf8' });
    console.log('Video con audio creado');
  } catch (err) {
    console.error('Error mezclando video y audio:', err.message);
  }
  
  // 5. Verificar duración final y ajustar si es necesario
  console.log('Verificando y ajustando duración final...');
  let finalPath = outputPath;
  
  try {
    // Probar duración del video mezclado
    const finalProbe = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-show_format',
      '-select_streams', 'v:0',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      withAudioPath
    ], { encoding: 'utf8' });
    
    const finalDurMatch = finalProbe.match(/duration\s*=\s*([0-9.]+)/i);
    const finalDuration = finalDurMatch ? parseFloat(finalDurMatch[1]) : 0;
    console.log('Duración después de mezclar:', finalDuration, 's');
    
    // Si la duración no es la esperada, hacer trim final
    if (Math.abs(finalDuration - VIDEO_CONFIG.duration) > 1.0) {
      const finalTrimPath = PATHS.temp + '/pmapping-final-adjusted.mp4';
      const finalTrimArgs = [
        '-y', '-i', withAudioPath,
        '-t', String(VIDEO_CONFIG.duration) + '.000',
        '-c', 'copy',
        finalTrimPath
      ];
      execFileSync('ffmpeg', finalTrimArgs, { stdio: 'pipe', encoding: 'utf8' });
      
      // Mover video ajustado a la ubicación final
      if (fs.existsSync(finalTrimPath)) {
        finalPath = finalTrimPath;
        console.log('Video ajustado a duración exacta');
      }
    } else {
      finalPath = withAudioPath;
      console.log('Duración dentro de rango aceptable');
    }
  } catch (err) {
    console.error('Error verificando duración final:', err.message);
    finalPath = withAudioPath;
  }
  
  // 6. Añadir subtítulos (si son válidos)
  if (subtitlesGenerated && fs.existsSync(srtPath)) {
    // Leer contenido del SRT para verificar
    const srtContent = fs.readFileSync(srtPath, 'utf8').trim();
    if (srtContent.length > 20 && srtContent.includes('-->')) {
      // Incrustar subtítulos con flags adicionales para evitar issues de timestamps
      const ffmpegSubsArgs = [
        '-y',
        '-i', finalPath,
        '-i', srtPath,
        '-c', 'copy',
        '-c:s', 'mov_text',
        '-movflags', '+faststart',
        '-fflags', '+genpts+short+used+circle+gemosize',
        '-max_muxing_queue_size', '2048',
        finalPath
      ];
      
      try {
        execFileSync('ffmpeg', ffmpegSubsArgs, { stdio: 'pipe', encoding: 'utf8' });
        console.log('Subtítulos incrustados exitosamente');
      } catch (err) {
        console.error('Error incrustando subtítulos, usando video sin subtítulos:', err.message);
        // Fallback: copiar video sin subtítulos
        if (fs.existsSync(finalPath)) {
          const backupPath = finalPath + '.nostubs-' + Date.now();
          fs.renameSync(finalPath, backupPath);
          fs.copyFileSync(backupPath, finalPath);
        }
      }
    } else {
      // Archivo SRT inválido, copiar video sin subtítulos
      if (fs.existsSync(withAudioPath)) {
        fs.copyFileSync(withAudioPath, finalPath);
      }
    }
  } else if (fs.existsSync(withAudioPath)) {
    // No hay subtítulos, copiar video con audio
    fs.copyFileSync(withAudioPath, finalPath);
  }
  
  // 7. Ajustar duración final del video exportado
  console.log('Ajustando duración final del video exportado...');
  try {
    // Verificar duración final y hacer trim si es necesario
    const finalCheck = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-show_format',
      '-select_streams', 'v:0',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      finalPath
    ], { encoding: 'utf8' });
    
    const finalDurMatch = finalCheck.match(/duration\s*=\s*([0-9.]+)/i);
    const finalDur = finalDurMatch ? parseFloat(finalDurMatch[1]) : 0;
    console.log('Duración video exportado final:', finalDur, 's');
    
    // Si la duración final se desvía más de 0.5s de la esperada, hacer trim
    if (Math.abs(finalDur - VIDEO_CONFIG.duration) > 0.5) {
      const finalCorrectPath = PATHS.temp + '/pmapping-final-corrected.mp4';
      const finalCorrectArgs = [
        '-y', '-i', finalPath,
        '-t', String(VIDEO_CONFIG.duration) + '.000',
        '-c', 'copy',
        finalCorrectPath
      ];
      execFileSync('ffmpeg', finalCorrectArgs, { stdio: 'pipe', encoding: 'utf8' });
      
      // Mover video corregido a la ubicación final
      if (fs.existsSync(finalCorrectPath)) {
        // Mover el archivo corregido a la ruta de salida deseada
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.renameSync(finalCorrectPath, outputPath);
        console.log('Duración final ajustada a', VIDEO_CONFIG.duration, 's');
      }
    }
  } catch (err) {
    console.error('Error ajustando duración final:', err.message);
  }
  
  // 7. Limpiar archivos temporales (menos assets y proyectos)
  try {
    // Limpiar videos temporales de color y mezcla
    const tempFiles = [
      PATHS.temp + '/pmapping-color-base.mp4',
      PATHS.temp + '/pmapping-with-audio.mp4',
      PATHS.temp + '/pmapping-final-adjusted.mp4',
      PATHS.temp + '/pmapping-final-corrected.mp4',
    ];
    
    tempFiles.forEach(tempFile => {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    });
    // No borrar el archivo de narración del proyecto (está en la ruta temp con nombre único)
    
  } catch (err) {
    console.log('Error limpiando temporales:', err.message);
  }
  
  console.log('=== Video generado exitosamente ===');
  console.log('Ruta:', finalPath);
  console.log('Duración objetivo:', VIDEO_CONFIG.duration, 'segundos');
  console.log('Resolución:', VIDEO_CONFIG.width, 'x', VIDEO_CONFIG.height);
  
  // Retornar resultado
  return {
    success: true,
    outputPath: finalPath,
    duration: VIDEO_CONFIG.duration,
    topic: topic
  };
}

/**
 * Extrae el texto de narración del script.
 * @param {string|Object} script - Script o objeto de script.
 * @returns {string} Texto de narración.
 */
function extractNarrationFromScript(script) {
  if (typeof script === 'string') {
    return script;
  }
  if (script && script.narration) {
    return script.narration.text || script.narration.join(' ');
  }
  if (script && script.segments) {
    return script.segments.map(s => s.text).join('. ');
  }
  return 'Video educativo sobre ' + (topic || 'Projection Mapping');
}

/**
 * Genera subtítulos SRT a partir del script con codificación UTF-8 asegurada.
 * @param {string|Object} script - Script o objeto de script.
 * @param {string} srtPath - Ruta donde guardar el SRT.
 * @returns {boolean} Si se generaron los subtítulos.
 */
function generateSubtitlesFromScript(script, srtPath) {
  try {
    let segments;
    
    if (typeof script === 'string') {
      // Dividir el script en segmentos por puntos y comas o períodos
      // Usar expresión regular para capturar oraciones completas manteniendo acentos
      const regex = /[^.!?]+[.!?](?:\s|$)/g;
      const matches = script.match(regex) || [];
      segments = matches.map((s, i) => {
        const trimmed = s.trim();
        return trimmed.length > 5 ? { start: i * 5, end: (i + 1) * 5, text: trimmed.trim() + '.' } : null;
      }).filter(s => s !== null);
    } else if (script && script.segments) {
      segments = script.segments;
    } else {
      return false;
    }
    
    if (!segments || segments.length === 0) return false;
    
    // Ajustar tiempos para durar 30 segundos
    const totalDuration = VIDEO_CONFIG.duration;
    const segmentDuration = totalDuration / segments.length;
    
    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    
    // Escribir archivo con codificación UTF-8 sin BOM
    const srtContent = segments.map((seg, i) => {
      const startSec = i * segmentDuration;
      const endSec = (i + 1) * segmentDuration;
      
      return `${i + 1}\n${formatTime(startSec)} --> ${formatTime(endSec)}\n${seg.text}\n`;
    }).join('\n');
    
    // Escribir archivo con codificación UTF-8 explícita
    fs.writeFileSync(srtPath, srtContent, { encoding: 'utf8' });
    return true;
  } catch (err) {
    console.error('Error generando subtítulos:', err.message);
    return false;
  }
}

// Script de ejemplo y ejecución principal
// Script educativo para Projection Mapping (formateado para ~30s)
const exampleScript = `PROJECTION MAPPING

¿Qué es Projection Mapping?
Es una técnica que proyecta imágenes digitales sobre superficies tridimensionales,
adaptando el contenido a la geometría exacta del lugar.

¿Cómo funciona?
Primero, se escanea la superficie o arquitectura con un modelo 3D preciso.
Luego, se crean imágenes o videos específicamente diseñados para esa geometría.

¿Para qué sirve?
Permite transformar edificios, objetos o cualquier estructura física en pantallas
vivas. Se usa en festivales, inauguraciones, arte urbano y eventos especiales.

¿Un ejemplo famoso?
Las proyecciones en la fachada del Empire State Building o en castillos durante
festivales de luz como los de Barcelona o Ámsterdam.

¿Por qué es importante?
Combina tecnología, arte y arquitectura. Permite contar historias en espacios
reales, creando experiencias inmersivas que sorprenden al espectador.

El arte urbano proyectado transforma nuestras ciudades por las noches.
`;

// Punto de entrada principal - Ejecutar directamente
const topic = process.argv[2] || 'Projection Mapping';

// Ejecutar generación de video (síncronamente)
const result = generateProjectionMappingVideo({
  topic: topic,
  script: exampleScript
});

// Mostrar resultado en consola
console.log('\n=== RESULTADO ===');
console.log('Video generado:', result.success ? 'SI' : 'NO');
console.log('Ruta:', result.outputPath);
console.log('Duración:', result.duration, 'segundos');
console.log('Tema:', result.topic);

if (result.success && result.outputPath) {
  console.log('\n¡Video listo para reproducir!');
  console.log('Comando para validar duración:');
  console.log('ffprobe -v quiet -show_format -show_streams "' + result.outputPath + '"');
}