import React from 'react';
import {
  TextField,
  Button
} from '@mui/material';
import { Link } from 'react-router-dom';
import './userPhotos.css';

import axios from 'axios'; 

/**
 * Define UserPhotos, a React componment of project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
          userId: undefined,
          userPhotosDetails: undefined
      };
  }

  componentDidMount() {
    const new_user_id = this.props.match.params.userId;
    this.handleUserChange(new_user_id);
}

componentDidUpdate() {
  const new_user_id = this.props.match.params.userId;
  const current_user_id = this.state.userId;
  if (current_user_id  !== new_user_id){
      this.handleUserChange(new_user_id);
  }
}

handleUserChange(user_id){
  axios.get("/photosOfUser/" + user_id)
      .then((response) =>
      {
          this.setState({
              userId : user_id,
              userPhotosDetails: response.data
          });
      });
  axios.get("/user/" + user_id)
      .then((response) =>
      {
          const new_user = response.data;
          const main_content = "User Photos for " + new_user.first_name + " " + new_user.last_name;
          this.props.changeTopbarContent(main_content);
      });
}

  render() {
      const {userId, userPhotosDetails } = this.state;
      return userId ? (
        <div>
          <Button
            variant="contained"
            size="medium"
            component={Link}
            to={`/users/${userId}`}
            className="button"
          >
            USER DETAIL
          </Button>
          {userPhotosDetails.map((userPhotoDetail) => (
            <div key={userPhotoDetail._id}>
              <TextField
                disabled
                fullWidth
                id="outlined-disabled"
                label="Photo Date"
                className="custom-field"
                value={userPhotoDetail.date_time}
              />
              <img
                src={`/images/${userPhotoDetail.file_name}`}
                className='custom-field'
              />
              {userPhotoDetail.comments && userPhotoDetail.comments.map((userComment) => (
                <div key={`photoDate_${userComment._id}`}>
                  <TextField
                    disabled
                    fullWidth
                    id="outlined-disabled"
                    label="Comment Date"
                    className="custom-field"
                    value={userComment.date_time}
                  />    
                  <TextField
                    fullWidth
                    id="outlined-disabled"
                    component={Link}
                    to={`/users/${userComment.user._id}`}
                    label="User"
                    className="custom-field"
                    value={`${userComment.user.first_name} ${userComment.user.last_name}`}
                  />
                  <TextField
                    disabled
                    fullWidth
                    id="outlined-disabled"
                    label="Comment"
                    multiline
                    rows={5}
                    className="custom-field"
                    value={userComment.comment}
                  />
                </div>          
              ))}  
            </div>
          ))}
        </div>
      ) : (
        <div />
      );
  }
}

export default UserPhotos;
