import React, { Component } from 'react';
import AgoraRTC from 'agora-rtc-sdk';
import ReactPlayer from 'react-player'
let client = AgoraRTC.createClient({ mode: 'live', codec: 'h264' });

const USER_ID = Math.floor(Math.random() * 1000000001);
const APP_ID = '0e54a27180124366967bf185be791140';

export default class Call extends Component {
  localStream = AgoraRTC.createStream({
    streamID: USER_ID,
    audio: true,
    video: true,
    screen: false
  });

  state = {
    remoteStreams: [],
    isMuted: false
  };

  componentDidMount() {
    this.initLocalStream();
    this.initClient();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.channel !== this.props.channel && this.props.channel !== '') {
      this.joinChannel();
    }
  }

  initLocalStream = () => {
    let me = this;
    me.localStream.init(
      function () {
        console.log('getUserMedia successfully');
        me.localStream.play('agora_local');
      },
      function (err) {
        console.log('getUserMedia failed', err);
      }
    );
  };

  initClient = () => {
    let me = this;
    client.init(
      APP_ID,
      function () {
        console.log('AgoraRTC client initialized');
        me.subscribeToClient();
      },
      function (err) {
        console.log('AgoraRTC client init failed', err);
      }
    );
  };

  joinBabies = () => {
    let me = this;
    client.join(
      null,
      me.props.channel,
      Math.floor(Math.random() * 1000000021),
      function (uid) {
        client.publish(me.localStream, function (err) {
          console.log('Publish local stream error: ' + err);
        });

        client.on('stream-published', function (evt) {
          console.log('Publish local stream successfully');
        });
      },
      function (err) {
        console.log('Join channel failed', err);
      }
    );
    client.join(
      null,
      me.props.channel,
      Math.floor(Math.random() * 1000000011),
      function (uid) {
        client.publish(me.localStream, function (err) {
          console.log('Publish local stream error: ' + err);
        });

        client.on('stream-published', function (evt) {
          console.log('Publish local stream successfully');
        });
      },
      function (err) {
        console.log('Join channel failed', err);
      }
    );
  };

  subscribeToClient = () => {
    let me = this;
    client.on('stream-added', me.onStreamAdded);
    client.on('stream-subscribed', me.onRemoteClientAdded);
    client.on('stream-removed', me.onStreamRemoved);

    client.on('peer-leave', me.onPeerLeave);
  };

  onMuteVideo = (e) => {
    let me = this;
    me.localStream.muteVideo('agora_local');
    me.setState({
      isMuted: true
    });
  };

  onUnMuteVideo = (e) => {
    let me = this;
    me.localStream.unmuteVideo('agora_local');
    me.setState({
      isMuted: false
    });
  };

  onStreamAdded = (evt) => {
    let me = this;
    let stream = evt.stream;
    me.setState(
      {
        remoteStreams: {
          ...me.state.remoteStream,
          [stream.getId()]: stream
        }
      },
      () => {
        // Subscribe after new remoteStreams state set to make sure
        // new stream dom el has been rendered for agora.io sdk to pick up
        client.subscribe(stream, function (err) {
          console.log('Subscribe stream failed', err);
        });
      }
    );
  };

  joinChannel = () => {
    let me = this;
    client.join(
      null,
      me.props.channel,
      USER_ID,
      function (uid) {
        client.publish(me.localStream, function (err) {
          console.log('Publish local stream error: ' + err);
        });

        client.on('stream-published', function (evt) {
          console.log('Publish local stream successfully');
        });
      },
      function (err) {
        console.log('Join channel failed', err);
      }
    );
  };

  onRemoteClientAdded = (evt) => {
    let me = this;
    let remoteStream = evt.stream;
    me.joinBabies();
    me.state.remoteStreams[remoteStream.getId()].play(
      'agora_remote ' + remoteStream.getId()
    );
  };

  onStreamRemoved = (evt) => {
    let me = this;
    let stream = evt.stream;
    if (stream) {
      let streamId = stream.getId();
      let { remoteStreams } = me.state;

      stream.stop();
      delete remoteStreams[streamId];

      me.setState({ remoteStreams });

      console.log('Remote stream is removed ' + stream.getId());
    }
  };

  onPeerLeave = (evt) => {
    let me = this;
    let stream = evt.stream;
    if (stream) {
      let streamId = stream.getId();
      let { remoteStreams } = me.state;

      stream.stop();
      delete remoteStreams[streamId];

      me.setState({ remoteStreams });

      console.log(evt.uid + ' leaved from this channel');
    }
  };

  render() {
    console.log('pankaj', this.state.remoteStreams);
    return (
      <div>
        <div className='video-warpper'>
          <div id='agora_local' style={{ width: '400px', height: '400px' }} />
          {Object.keys(this.state.remoteStreams).map((key) => {
            let stream = this.state.remoteStreams[key];
            let streamId = stream.getId();
            return (
              <div
                key={streamId}
                id={`agora_remote ${streamId}`}
                style={{ width: '400px', height: '400px' }}
              />
            );
          })}
          <ReactPlayer playing url={require('../videos/Video1.mp4')}  />
          <ReactPlayer playing url={require('../videos/Video2.mp4')} />
          <ReactPlayer playing url={require('../videos/Video3.mp4')} />
        </div>
        {this.state.isMuted ? (
          <button onClick={this.onUnMuteVideo}>Resume</button>
        ) : (
          <button onClick={this.onMuteVideo}>Pause</button>
        )}
      </div>
    );
  }
}
