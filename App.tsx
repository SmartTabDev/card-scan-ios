/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useRef, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
  Platform,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import ImagePicker, {ImageOrVideo} from 'react-native-image-crop-picker';
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
} from 'react-native-vision-camera';

import {interpretImage} from './api/interpret';
import {Capture} from './assets/icons';




type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const [processedText, setProcessedText] = React.useState<string>(
    'Scan a Card to see\nContact info here',
  );
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  let device: any = devices.back;
  const [hasPermissions, setHasPermissions] = useState<boolean>(false);
  const [isProcessingText, setIsProcessingText] = useState<boolean>(false);
  const [cardIsFound, setCardIsFound] = useState<boolean>(false);
  const [contactInfo, setContactInfo] = useState<object>({});

  const validateCard: (result: object) => void = result => {
    const keys = Object.keys(result);
   
    if (keys?.length) {
      setContactInfo(result);
      setCardIsFound(true);
    } else {
      setProcessedText('No valid Business Card found, please try again!!');
      setCardIsFound(false);
    }
  };

  const pickAndRecognize: () => void = useCallback(async () => {
    if(ImagePicker !== null){
      ImagePicker.openPicker({
        cropping: false,
      })
        .then(async (res: ImageOrVideo) => {
          setIsProcessingText(true);
          let result = await interpretImage(res);
          setIsProcessingText(false);
          validateCard(result?.data ?? {});
        })
        .catch(err => {
          // console.log('err:', err);
          Alert.alert(
            'Alert Title',
            (err).toString(),
            [
              {
                text: 'OK',
                onPress: () => {
                  // Do something when OK is pressed
                },
              },
              // You can add more buttons here
            ],
            { cancelable: true }
          );
          setIsProcessingText(false);
        });
    }
    
  }, []);

  const captureAndRecognize = useCallback(async () => {
    try {
      setIsProcessingText(true);
      const image = await camera.current?.takePhoto({
        qualityPrioritization: 'quality',
        enableAutoStabilization: true,
        flash: 'on',
        skipMetadata: true,
      });
      const imagePath =
        Platform.OS === 'ios' ? image?.path : `file://${image?.path}`;
      const result = await interpretImage({
        ...image,
        path: imagePath,
      });
      setIsProcessingText(false);
      validateCard(result?.data ?? {});
    } catch (err) {
      console.log('err:', err);
      setIsProcessingText(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={'dark-content'} />
      <Text style={styles.title}>Business Card Scanner</Text>
      <Pressable style={styles.galleryBtn} onPress={pickAndRecognize}>
        <Text style={styles.btnText}>Pick from Gallery</Text>
      </Pressable>
      {device && hasPermissions ? (
        <View>
          <Camera
            photo
            enableHighQualityPhotos
            ref={camera}
            style={styles.camera}
            isActive={true}
            device={device}
          />
          <Pressable
            style={styles.captureBtnContainer}
            onPress={captureAndRecognize}>
            <Image source={Capture} />
          </Pressable>
        </View>
      ) : (
        <Text>No Camera Found</Text>
      )}
      {isProcessingText ? (
        <ActivityIndicator
          size={'large'}
          style={styles.activityIndicator}
          color={'blue'}
        />
      ) : cardIsFound ? (
        <ScrollView
          style={styles.infoWrapper}
          contentContainerStyle={styles.infoContainer}>
          {Object.keys(contactInfo).map((key, index) => (
            <View style={styles.contactRow} key={`contact-row-${index}`}>
              <Text style={styles.contactRowKey}>{key}:</Text>
              {(contactInfo as any)[key]?.length ? (
                (contactInfo as any)[key].map((row: string, id: number) => (
                  <Text key={`contact-row${id}`} style={styles.contactRowValue}>
                    {row}
                  </Text>
                ))
              ) : (
                <Text style={styles.contactRowValue}>Undefined</Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.errorText}>{processedText}</Text>
      )}
      {/* <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
        <Header />
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
          }}>
          <Section title="Step One🥗">
            Edit <Text style={styles.highlight}>App.tsx</Text> to change this
            screen and then come back to see your edits.
          </Section>
          <Section title="See Your Changes">
            <ReloadInstructions />
          </Section>
          <Section title="Debug">
            <DebugInstructions />
          </Section>
          <Section title="Learn More">
            Read the docs to discover what to do next:
          </Section>
          <LearnMoreLinks />
        </View>
      </ScrollView> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  infoWrapper: {
    width: '100%',
  },
  infoContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },

  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  camera: {
    marginVertical: 24,
    height: 240,
    width: 360,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.6,
    marginTop: 18,
  },
  galleryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#000',
    borderRadius: 40,
    marginTop: 18,
  },
  btnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '400',
    letterSpacing: 0.4,
  },
  errorText: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'purple',
    textAlign: 'center',
    alignSelf: 'center',
  },
  captureBtnContainer: {
    position: 'absolute',
    bottom: 28,
    right: 10,
    zIndex: 20,
  },
  activityIndicator: {
    marginTop: 34,
  },
  contactRowKey: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: 'red',
    textTransform: 'uppercase',
  },
  contactRowValue: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
    color: 'blue',
    width: '100%',
  },
  contactRow: {
    marginTop: 20,
    paddingHorizontal: 16,
    width: '100%',
  },
});

export default App;
