import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guideline dimensions based on standard screen (similar to design)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = (size) => (SCREEN_WIDTH / guidelineBaseWidth) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

export { 
  scale, 
  verticalScale, 
  moderateScale, 
  SCREEN_WIDTH, 
  SCREEN_HEIGHT 
};
