import React, { Component } from 'react';
import Guid from 'guid';
import {
    Grid,
    Row,
    Col,
    Form,
    FormControl,
    Button,
    ListGroup,
    ListGroupItem,
    Nav,
    Navbar,
    NavItem,
    InputGroup,
    Modal,
} from 'react-bootstrap';
import RealtimeClient from './RealtimeClient';
import './App.css';
import _ from 'lodash';
import Filter from 'bad-words';

const filter = new Filter({ placeHolder: '🌩'});
filter.addWords(['Google', 'Kube', 'Kubernetes', 'server', 'serverless']);

const getClientId = () => 'web-client:' + Guid.raw();

const getMessageId = () => 'message-id:' + Guid.raw();

const User = (user) => (
    <ListGroupItem key={user.clientId}>{ filter.clean(user.username) }</ListGroupItem>
)

const SentimentItem = (sentiment) => (
    <ListGroupItem className="sentiment" key={sentiment.key}>{ sentiment.val }</ListGroupItem>
)

const Users = ({ users }) => (
    <ListGroup>
        <ListGroupItem key='title'><i>Connected users</i></ListGroupItem>
        { users.map(User) }
    </ListGroup>
);

const Sentiment = ({ sentiment }) => {
  const mapping = {
    "Positive": "😁",
    "Negative": "😞",
    "Neutral": "🤷‍",
    "Mixed": "😭 + 🤣",
  };
  const status = {
    key: "Positive",
    score: 0,
    val: mapping["Positive"]
  };

  _.forOwn(sentiment, (value, key) => {
    if (value > status.score) {
      status.key = key;
      status.score = value;
      status.val = mapping[key];
    }
  });

  return (
    <ListGroup>
        <ListGroupItem key='title'><i>Tweet sentiment</i></ListGroupItem>
        { SentimentItem(status) }
    </ListGroup>);
}

const Tweet = (tweet) => (
  <ListGroupItem key={tweet.id}><b>{filter.clean(tweet.user.screen_name)}</b> : {filter.clean(tweet.text)}</ListGroupItem>
);

const Tweets = ({ tweets }) => (
  <div id="Tweets">
      <ListGroup>
          <ListGroupItem key='title'><i>Tweet Stream</i></ListGroupItem>
          { tweets.map(Tweet) }
      </ListGroup>
  </div>
);

const Message = (message) => (
    <ListGroupItem key={message.id}><b>{filter.clean(message.username)}</b> : {filter.clean(message.message)}</ListGroupItem>
)

const ChatMessages = ({ messages }) => (
    <div id="messages">
        <ListGroup>
            <ListGroupItem key='title'><i>Messages</i></ListGroupItem>
            { messages.map(Message) }
        </ListGroup>
    </div>
);

const ChatHeader = ({ isConnected }) => (
    <Navbar fixedTop>
        <Navbar.Header>
            <Navbar.Brand>
                AWS Summit Meetup Lounge
            </Navbar.Brand>
        </Navbar.Header>
        <Nav>
            <NavItem>{ isConnected ? 'Connected' : 'Not connected'}</NavItem>
        </Nav>
    </Navbar>
);

const ChatInput = ({ onSend }) => {
    const onSubmit = (event) => {
        onSend(this.input.value);
        this.input.value = '';
        event.preventDefault();
    }
    return (
        <Navbar fixedBottom fluid>
            <Col xs={9} xsOffset={3}>
                <Form inline onSubmit={ onSubmit }>
                    <InputGroup>
                        <FormControl
                            type="text"
                            placeholder="Type your message"
                            inputRef={ref => { this.input = ref; }}
                        />
                        <InputGroup.Button>
                            <Button type="submit" >Send</Button>
                        </InputGroup.Button>
                    </InputGroup>
                </Form>
            </Col>
        </Navbar>
    );
};

const ChatWindow = ({ tweets, sentiment, users, messages, onSend }) => (
    <div>
        <Grid fluid>
            <Row>
                <Col xs={3}>
                  <div className="sidebar-wrapper">
                    <div className="sidebar">
                      <Sentiment
                          sentiment={ sentiment }
                      />
                      <Users
                          users={ users }
                      />
                    </div>
                  </div>
                </Col>
                <Col xs={6}>
                    <ChatMessages
                        messages={ messages }
                    />
                </Col>
                <Col xs={3}>
                  <div className="sidebar-wrapper">
                    <div className="sidebar">
                      <Tweets
                          tweets={ tweets }
                      />
                    </div>
                  </div>
                </Col>
            </Row>
        </Grid>
        <ChatInput onSend={ onSend }/>
    </div>
);

class UserNamePrompt extends Component {
    constructor(props) {
        super(props);

        this.state = { showModal: true }
    }

    render() {
        const onSubmit = (event) => {
            if (this.input.value) {
                this.props.onPickUsername(this.input.value);
                this.setState({ showModal: false });
            }
            event.preventDefault();
        }
        return (
            <Modal show={this.state.showModal} bsSize="sm">
                <Form inline onSubmit={ onSubmit }>
                    <Modal.Header closeButton>
                        <Modal.Title>Pick your username</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <FormControl
                            type="text"
                            placeholder="Type your username"
                            inputRef={ref => {
                                this.input = ref;
                            }}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button type="submit">Ok</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        );
    }
}

class App extends Component {
    constructor(props) {
        super(props);

        this.onSend = this.onSend.bind(this);
        this.connect = this.connect.bind(this);

        this.state = {
            sentiment: {},
            tweets: [],
            users: [],
            messages: [],
            clientId: getClientId(),
            isConnected: false,
        };
    }

    connect(username) {
        this.setState({ username });

        this.client = new RealtimeClient(this.state.clientId, username);

        this.client.connect()
            .then(() => {
                this.setState({ isConnected: true });
                this.client.onMessageReceived((topic, message) => {
                    if (topic === 'client-connected') {
                        this.setState({ users: [...this.state.users, message] })
                    } else if (topic === 'client-disconnected') {
                      this.setState({ users: this.state.users.filter(user => user.clientId !== message.clientId) })
                    } else if (topic === 'sentiment') {
                      this.setState({ sentiment: message })
                    } else if (topic === 'tweets') {
                      const currentTweets = _.map(this.state.tweets, 'id');
                      const newTweets = _.filter(message, (t) => !currentTweets.includes(t.id) )
                      this.setState({ tweets: _.orderBy([...this.state.tweets, ...newTweets], ['id'], ['desc']) })
                    } else {
                        this.setState({ messages: [...this.state.messages, message] });
                    }
                })
            })
    }

    onSend(message) {
        this.client.sendMessage({
            username: this.state.username,
            message: message,
            id: getMessageId(),
        });
    };

    render() {
        return (
            <div>
                <ChatHeader
                    isConnected={ this.state.isConnected }
                />
                <ChatWindow
                    tweets={ this.state.tweets }
                    sentiment={ this.state.sentiment }
                    users={ this.state.users }
                    messages={ this.state.messages }
                    onSend={ this.onSend }
                />
                <UserNamePrompt
                    onPickUsername={ this.connect }
                />
            </div>
        );
    }
}

export default App;
